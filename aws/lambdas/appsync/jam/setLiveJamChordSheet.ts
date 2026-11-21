import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { _JamSession, _SetList, _Song } from '../../type'
import { canEditJamSongs } from '../../util/jamAccess'
import { findLiveJamSong } from '../../util/liveJamSong'
import { resolvedChordSheetKey } from '../../util/detectKey'
import { updateDynamoUtil } from '../../util/dynamo'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export async function writeOwnedChordSheet(dynamo: DynamoDBClient, b: {
  jamSessionId: string
  songId: string
  userId: string
  chordSheet: string
  chordSheetKey?: string | null
  originLink?: string | null
}) {
  const jamRes = await dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } },
  }))
  if (!jamRes.Item) { console.error(`jam not found: ${b.jamSessionId}`); return }
  const jam = unmarshall(jamRes.Item) as _JamSession & { playlist?: unknown, queue?: unknown }
  if (jam.endDate) { console.error(`jam has ended: ${b.jamSessionId}`); return }
  if (!canEditJamSongs(jam, b.userId)) {
    console.error(`user ${b.userId} cannot edit ${b.jamSessionId}`)
    return
  }

  let setSongs: { songId?: string | null, key?: string | null }[] = []
  if (!Array.isArray(jam.playlist)) {
    const setRes = await dynamo.send(new GetItemCommand({
      TableName: SETLIST_TABLE_NAME,
      Key: { setListId: { S: jam.setListId } },
    }))
    if (!setRes.Item) { console.error(`set not found: ${jam.setListId}`); return }
    const setList = unmarshall(setRes.Item) as _SetList
    setSongs = Array.isArray(setList.songs) ? setList.songs : []
  }
  const live = findLiveJamSong({
    songId: b.songId,
    setSongs,
    playlist: jam.playlist,
    queue: jam.queue,
  })
  if (!live) { console.error(`song ${b.songId} is not in the jam`); return }

  const songRes = await dynamo.send(new GetItemCommand({
    TableName: SONG_TABLE_NAME,
    Key: { songId: { S: b.songId } },
  }))
  if (!songRes.Item) { console.error(`song not found: ${b.songId}`); return }
  const song = unmarshall(songRes.Item) as _Song
  if (song.userId !== b.userId) {
    console.error(`user ${b.userId} does not own song ${b.songId}`)
    return
  }

  const chordSheetKey = resolvedChordSheetKey({
    chordSheet: b.chordSheet,
    currentKey: song.chordSheetKey,
    providedKey: b.chordSheetKey,
    importPath: true,
  }) || b.chordSheetKey?.trim() || song.chordSheetKey || 'C'
  const update: Record<string, string> = {
    chordSheet: b.chordSheet,
    chordSheetKey,
    originPlatorm: 'UG',
  }
  if (b.originLink?.trim()) update.originLink = b.originLink.trim()

  await dynamo.send(new UpdateItemCommand(updateDynamoUtil({
    table: SONG_TABLE_NAME,
    key: { songId: song.songId },
    item: update,
  })))

  const next = { ...song, ...update }
  if (next.isApproved == null) next.isApproved = false
  if (next.version == null) next.version = 1
  return {
    jamSessionId: jam.jamSessionId,
    index: live.index,
    key: live.key || chordSheetKey,
    jumpTo: false,
    song: next,
  }
}

/**
 * Writes a chord sheet onto a song the caller owns and publishes it on the jam.
 * Does not fetch Ultimate Guitar. Does not append a second copy of the song.
 */
export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string
  songId: string
  userId: string
  chordSheet: string
  chordSheetKey?: string | null
  originLink?: string | null
}, null>) => {
  const b = event.arguments
  if (!b?.jamSessionId || !b.songId || !b.userId || !b.chordSheet?.trim()) {
    console.error('jamSessionId, songId, userId, and chordSheet are required')
    return
  }
  const dynamo = new DynamoDBClient({})
  return writeOwnedChordSheet(dynamo, b)
}
