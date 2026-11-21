import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'
import { liveJamRows } from '../../util/liveJamSong'
import { _JamSession, _SetList } from '../../type'
import { unmarshall } from '@aws-sdk/util-dynamodb'

export type NextSongChoice = {
  song: number
  page: number
  key: string
  queue: number[]
}

/**
 * The index the player sends is into the live list: the playlist when the jam
 * has one, otherwise the set. A set that is shorter than the playlist must not
 * reject that index.
 */
export function resolveNextSong(input: {
  requestedSong?: number | null
  currentSong?: number | null
  queue?: Array<number | null> | null
  setSongs?: { songId?: string | null, key?: string | null }[] | null
  playlist?: unknown
}): NextSongChoice | null {
  const live = liveJamRows(input.setSongs, input.playlist)
  const queue = (input.queue || []).map((n) => Number(n)).filter((n) => Number.isInteger(n) && n >= 0)
  if (live.length === 0) {
    return { song: 0, page: 0, key: 'C', queue }
  }

  let song = input.requestedSong
  if (song == null) {
    if (queue.length > 0) {
      song = queue.shift() as number
    } else if ((input.currentSong ?? 0) + 1 < live.length) {
      song = (input.currentSong ?? 0) + 1
    } else {
      song = 0
    }
  }
  if (song == null || song < 0 || song >= live.length) return null
  return { song, page: 0, key: live[song].key || 'C', queue }
}

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, song?: number, page?: number
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.jamSessionId is empty`); return }

  const dynamo = new DynamoDBClient({})
  console.log(`song: ${b.song}`)

  const r0 = dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } }
  }))
  
  let updateJam = { 
    table: JAM_TABLE_NAME, 
    key: { jamSessionId: b.jamSessionId },
    item: { currentSong: b.song || 0, currentPage: b.page || 0 } as any
  }

  const res0 = (await (r0))?.Item
  if (!res0) { console.error(`Jam not found: ${b.jamSessionId}`); return }

  const jam = unmarshall(res0) as _JamSession & { playlist?: unknown, currentSong?: number }
  const setListId = jam.setListId

  const res1 = await dynamo.send(new GetItemCommand({
    TableName: SETLIST_TABLE_NAME, Key: { setListId: { S: setListId } }
  }))
  if (!res1 || !res1.Item) { console.error(`SetList not found: ${setListId}`); return }
  const set = unmarshall(res1.Item) as _SetList
  const choice = resolveNextSong({
    requestedSong: b.song,
    currentSong: jam.currentSong,
    queue: jam.queue,
    setSongs: Array.isArray(set.songs) ? set.songs : [],
    playlist: jam.playlist,
  })
  if (!choice) { console.error(`song at index: ${b.song} not found`); return }

  updateJam.item.currentSong = choice.song
  updateJam.item.currentPage = choice.page
  if (b.song == null && jam.queue && jam.queue.length > 0) updateJam.item.queue = choice.queue

  const params = updateDynamoUtil(updateJam)
  console.log(params)
  const res2 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res2)

  return { jamSessionId: b.jamSessionId, song: choice.song, page: choice.page, key: choice.key, queue: choice.queue }
}