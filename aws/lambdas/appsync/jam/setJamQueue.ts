import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { liveIndex, liveIndexes } from '../../util/liveJamSong'
import { _SetList } from '../../type'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, queue: number[], expectedRevision?: number, currentSongIndex?: number
}, null>) => {
  const b = event.arguments
  if (!b) { console.error('event.arguments is empty'); return }
  if (!b.jamSessionId) { console.error('b.jamSessionId is empty'); return }
  if (!Array.isArray(b.queue)) { console.error('queue must be an array'); return }

  console.log('setJamQueue', b.jamSessionId, 'expectedRevision', b.expectedRevision, 'currentSongIndex', b.currentSongIndex)

  const dynamo = new DynamoDBClient({})

  const res = await dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } }
  }))
  if (!res.Item) { console.error(`Jam not found: ${b.jamSessionId}`); return }
  const jam = unmarshall(res.Item) as { jamSessionId: string, setListId?: string, playlist?: unknown, queue?: number[], revision?: number }
  let setSongs: { songId?: string | null, key?: string | null }[] = []
  if (!Array.isArray(jam.playlist)) {
    if (!jam.setListId) { console.error('setListId is empty'); return }
    const setRes = await dynamo.send(new GetItemCommand({
      TableName: process.env.SETLIST_TABLE_NAME || '',
      Key: { setListId: { S: jam.setListId } },
      ProjectionExpression: 'songs',
    }))
    setSongs = setRes.Item ? ((unmarshall(setRes.Item) as _SetList).songs || []) : []
  }

  const cleanQueue = liveIndexes(
    (b.queue || []).map((n) => Number.isFinite(n) ? Number(n) : -1),
    setSongs,
    jam.playlist,
  )
  const currentRevision = typeof jam.revision === 'number' ? jam.revision : 0
  const nextRevision = currentRevision + 1

  const updateExpressions = ['#queue = :queue', '#revision = :nextRevision']
  const expressionAttributeNames: Record<string, string> = {
    '#queue': 'queue',
    '#revision': 'revision',
  }
  const expressionAttributeValues: Record<string, any> = {
    ':queue': { L: cleanQueue.map((n) => ({ N: String(n) })) },
    ':nextRevision': { N: String(nextRevision) },
  }

  const nextSong = liveIndex(b.currentSongIndex, setSongs, jam.playlist)
  if (b.currentSongIndex !== undefined && b.currentSongIndex !== null && nextSong != null) {
    updateExpressions.push('#currentSong = :currentSong', '#currentPage = :currentPage')
    expressionAttributeNames['#currentSong'] = 'currentSong'
    expressionAttributeNames['#currentPage'] = 'currentPage'
    expressionAttributeValues[':currentSong'] = { N: String(nextSong) }
    expressionAttributeValues[':currentPage'] = { N: '0' }
  }

  try {
    await dynamo.send(new UpdateItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: jam.jamSessionId } },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'NONE',
    }))
    return {
      jamSessionId: b.jamSessionId,
      queue: cleanQueue,
      revision: nextRevision,
      currentSongIndex: nextSong
    }
  } catch (e) {
    console.error('Failed to setJamQueue', e)
    return {
      jamSessionId: b.jamSessionId,
      queue: jam.queue || [],
      revision: currentRevision,
      currentSongIndex: nextSong
    }
  }
}
