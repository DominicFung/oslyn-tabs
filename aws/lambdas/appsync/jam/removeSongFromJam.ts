import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { _JamSession, _SetList, _Song } from '../../type'
import { canEditJamSongs } from '../../util/jamAccess'
import { PlaylistRow, asPlaylist, remapCurrent, remapIndexes, withoutIndexes } from '../../util/songIndex'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

/**
 * Drops one song from this jam's playlist and queue. The set and the song record stay.
 * A jam with no playlist of its own copies the set list into jam.playlist on the first removal.
 */
export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, songId: string, userId: string, index?: number | null
}, null>) => {
  const b = event.arguments
  if (!b?.jamSessionId || !b.songId || !b.userId) {
    console.error('jamSessionId, songId, and userId are required')
    return
  }
  const dynamo = new DynamoDBClient({})
  const jamRes = await dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } },
  }))
  if (!jamRes.Item) { console.error(`jam not found: ${b.jamSessionId}`); return }
  const jam = unmarshall(jamRes.Item) as _JamSession & { playlist?: unknown, queue?: number[], currentSong?: number }
  if (jam.endDate) { console.error(`jam has ended: ${b.jamSessionId}`); return }
  if (!canEditJamSongs(jam, b.userId)) {
    console.error(`user ${b.userId} cannot edit ${b.jamSessionId}`)
    return
  }

  const setRes = await dynamo.send(new GetItemCommand({
    TableName: SETLIST_TABLE_NAME,
    Key: { setListId: { S: jam.setListId } },
    ProjectionExpression: 'songs',
  }))
  const setSongs = asPlaylist(setRes.Item ? (unmarshall(setRes.Item) as _SetList).songs : [])
  const source = Array.isArray(jam.playlist) ? asPlaylist(jam.playlist) : setSongs
  const index = pickIndex(source, b.songId, b.index)
  if (index < 0) { console.error(`song ${b.songId} is not in jam ${b.jamSessionId}`); return }

  const playlist = withoutIndexes(source, [index])
  const queue = remapIndexes(Array.isArray(jam.queue) ? jam.queue.map(Number) : [], [index])
    .filter((n) => n >= 0 && n < playlist.length)
  const currentSong = remapCurrent(typeof jam.currentSong === 'number' ? jam.currentSong : 0, [index], playlist.length)

  await dynamo.send(new UpdateItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } },
    UpdateExpression: 'SET playlist = :playlist, #queue = :queue, currentSong = :current, currentPage = :page',
    ExpressionAttributeNames: { '#queue': 'queue' },
    ExpressionAttributeValues: marshall({
      ':playlist': playlist,
      ':queue': queue,
      ':current': currentSong,
      ':page': 0,
    }),
  }))

  let title = 'Song'
  const songRes = await dynamo.send(new GetItemCommand({
    TableName: SONG_TABLE_NAME,
    Key: { songId: { S: b.songId } },
    ProjectionExpression: 'title',
  }))
  if (songRes.Item) title = (unmarshall(songRes.Item) as _Song).title || title

  return {
    jamSessionId: b.jamSessionId,
    songId: b.songId,
    title,
    index,
    currentSong,
    queue,
    songIds: playlist.map((row) => row.songId),
  }
}

function pickIndex(rows: PlaylistRow[], songId: string, index?: number | null): number {
  if (typeof index === 'number' && index >= 0 && index < rows.length && rows[index].songId === songId) return index
  return rows.findIndex((row) => row.songId === songId)
}
