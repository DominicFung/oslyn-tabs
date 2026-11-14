import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { _JamSession, _SetList, _Song } from '../../type'
import { canEditJamSongs } from '../../util/jamAccess'
import { normalizeSong } from '../../util/selection'
import { updateDynamoUtil } from '../../util/dynamo'
import { bandSongIds, loadUser, songSharedWith } from '../song/library'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

/**
 * Appends one song to the jam's set and returns that song (with chordSheet when selected).
 * Does not write jam.queue. The Queue button calls setJamQueue.
 */
export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string
  songId: string
  key: string
  userId: string
  jumpTo?: boolean | null
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b?.jamSessionId || !b.songId || !b.key || !b.userId) {
    console.error('jamSessionId, songId, key, and userId are required')
    return
  }

  const dynamo = new DynamoDBClient({})
  const jamRes = await dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } },
  }))
  if (!jamRes.Item) { console.error(`jam not found: ${b.jamSessionId}`); return }
  const jam = unmarshall(jamRes.Item) as _JamSession
  if (jam.endDate) { console.error(`jam has ended: ${b.jamSessionId}`); return }
  if (!canEditJamSongs(jam, b.userId)) {
    console.error(`user ${b.userId} cannot add songs to ${b.jamSessionId}`)
    return
  }

  const songRes = await dynamo.send(new GetItemCommand({
    TableName: SONG_TABLE_NAME,
    Key: { songId: { S: b.songId } },
  }))
  if (!songRes.Item) { console.error(`song not found: ${b.songId}`); return }
  const song = unmarshall(songRes.Item) as _Song

  const user = await loadUser(dynamo, b.userId)
  if (!user) { console.error(`user not found: ${b.userId}`); return }
  const visible = songSharedWith(song, b.userId) || (await bandSongIds(dynamo, b.userId, user)).has(song.songId)
  if (!visible) { console.error(`user ${b.userId} cannot use song ${b.songId}`); return }

  const key = b.key || song.chordSheetKey || 'C'
  const appended = await dynamo.send(new UpdateItemCommand({
    TableName: SETLIST_TABLE_NAME,
    Key: { setListId: { S: jam.setListId } },
    UpdateExpression: 'SET #songs = list_append(if_not_exists(#songs, :empty), :added)',
    ExpressionAttributeNames: { '#songs': 'songs' },
    ExpressionAttributeValues: marshall({
      ':empty': [],
      ':added': [{ songId: b.songId, key }],
    }),
    ReturnValues: 'ALL_NEW',
  }))
  if (!appended.Attributes) { console.error('set update did not return the song list'); return }

  const setList = unmarshall(appended.Attributes) as _SetList
  const songs = Array.isArray(setList.songs) ? setList.songs : []
  const index = Math.max(0, songs.length - 1)
  const jumpTo = !!b.jumpTo

  if (jumpTo) {
    await dynamo.send(new UpdateItemCommand(updateDynamoUtil({
      table: JAM_TABLE_NAME,
      key: { jamSessionId: jam.jamSessionId },
      item: { currentSong: index, currentPage: 0 },
    })))
  }

  if (song.isApproved == null) song.isApproved = false
  if (song.version == null) (song as any).version = 1
  const payloadSong = normalizeSong(song, event.info.selectionSetList)

  return {
    jamSessionId: jam.jamSessionId,
    index,
    key,
    jumpTo,
    song: payloadSong,
  }
}
