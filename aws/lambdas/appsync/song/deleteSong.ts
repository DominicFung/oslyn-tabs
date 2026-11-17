import { AppSyncResolverEvent } from 'aws-lambda'
import {
  BatchWriteItemCommand, DeleteItemCommand, DynamoDBClient, QueryCommand, UpdateItemCommand,
  WriteRequest,
} from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { chunk } from '../../util/dynamo'
import { indexesOf, remapCurrent, remapIndexes, withoutIndexes } from '../../util/songIndex'
import { ownedSong } from './getSongUsage'
import { JamHit, jamPlaylist, jamsContaining, loadSetsAndJams, setsContaining } from './usage'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const CHORD_IMPORT_TABLE_NAME = process.env.CHORD_IMPORT_TABLE_NAME || ''

const WRITE_BATCH = 25

export const handler = async (event: AppSyncResolverEvent<{ songId: string, userId: string }, null>) => {
  const b = event.arguments
  if (!b?.songId || !b.userId) { console.error('songId and userId are required'); return }
  const dynamo = new DynamoDBClient({})
  const song = await ownedSong(dynamo, b.songId, b.userId)
  if (!song) return

  const { sets, jams } = await loadSetsAndJams(dynamo)
  const setHits = setsContaining(sets, b.songId)
  const jamHits = jamsContaining(jams, sets, b.songId, false)

  await runChunked(setHits.map((hit) => () => dynamo.send(new UpdateItemCommand({
    TableName: SETLIST_TABLE_NAME,
    Key: { setListId: { S: hit.setListId } },
    UpdateExpression: 'SET #songs = :songs',
    ExpressionAttributeNames: { '#songs': 'songs' },
    ExpressionAttributeValues: marshall({
      ':songs': hit.songs.filter((row) => row.songId !== b.songId),
    }),
  }))))

  const jamPayload = jamHits.map((jam) => planJam(jam, sets, b.songId))
  await runChunked(jamPayload.map((plan) => () => dynamo.send(new UpdateItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: plan.jamSessionId } },
    UpdateExpression: plan.writePlaylist
      ? 'SET playlist = :playlist, #queue = :queue, currentSong = :current, currentPage = :page'
      : 'SET #queue = :queue, currentSong = :current, currentPage = :page',
    ExpressionAttributeNames: { '#queue': 'queue' },
    ExpressionAttributeValues: marshall({
      ':queue': plan.queue,
      ':current': plan.currentSong,
      ':page': 0,
      ...(plan.writePlaylist ? { ':playlist': plan.playlist } : {}),
    }),
  }))))

  const removedImports = await deleteImports(dynamo, b.songId)

  await dynamo.send(new DeleteItemCommand({
    TableName: SONG_TABLE_NAME,
    Key: { songId: { S: b.songId } },
    ConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': { S: b.userId } },
  }))

  console.log(`deleted song ${b.songId}: ${setHits.length} sets, ${jamPayload.length} jams, ${removedImports} imports`)
  return {
    songId: b.songId,
    title: song.title || 'Song',
    userId: b.userId,
    setsAffected: setHits.length,
    jamsAffected: jamPayload.length,
    jams: jamPayload.map((plan) => ({
      jamSessionId: plan.jamSessionId,
      currentSong: plan.currentSong,
      queue: plan.queue,
      songIds: plan.songIds,
    })),
  }
}

function planJam(jam: JamHit, sets: Map<string, { songId: string, key: string }[]>, songId: string) {
  const source = jamPlaylist(jam, sets)
  const removeAt = indexesOf(source, songId)
  const playlist = withoutIndexes(source, removeAt)
  const queue = remapIndexes(jam.queue, removeAt).filter((index) => index >= 0 && index < playlist.length)
  return {
    jamSessionId: jam.jamSessionId,
    writePlaylist: !!jam.playlist,
    playlist,
    songIds: playlist.map((row) => row.songId),
    queue,
    currentSong: remapCurrent(jam.currentSong, removeAt, playlist.length),
  }
}

async function deleteImports(dynamo: DynamoDBClient, songId: string): Promise<number> {
  if (!CHORD_IMPORT_TABLE_NAME) return 0
  const requestIds: string[] = []
  for (const status of ['PENDING', 'IMPORTING', 'DONE', 'FAILED']) {
    let start: Record<string, any> | undefined
    do {
      const res = await dynamo.send(new QueryCommand({
        TableName: CHORD_IMPORT_TABLE_NAME,
        IndexName: 'status',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': { S: status } },
        ProjectionExpression: 'requestId, songId',
        ExclusiveStartKey: start,
      }))
      for (const item of res.Items || []) {
        if (item.songId?.S === songId && item.requestId?.S) requestIds.push(item.requestId.S)
      }
      start = res.LastEvaluatedKey
    } while (start)
  }

  for (const group of chunk(requestIds, WRITE_BATCH)) {
    await batchDelete(dynamo, group)
  }
  return requestIds.length
}

async function batchDelete(dynamo: DynamoDBClient, requestIds: string[]) {
  let request: WriteRequest[] = requestIds.map((requestId) => ({
    DeleteRequest: { Key: { requestId: { S: requestId } } },
  }))
  for (let attempt = 0; attempt < 6 && request.length; attempt++) {
    const res = await dynamo.send(new BatchWriteItemCommand({
      RequestItems: { [CHORD_IMPORT_TABLE_NAME]: request },
    }))
    const left = res.UnprocessedItems?.[CHORD_IMPORT_TABLE_NAME]
    request = Array.isArray(left) ? left : []
  }
}

async function runChunked(tasks: Array<() => Promise<unknown>>) {
  for (const group of chunk(tasks, WRITE_BATCH)) {
    await Promise.all(group.map((task) => task()))
  }
}
