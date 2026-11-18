import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { scanAll } from '../../util/batch'
import { PlaylistRow, asPlaylist } from '../../util/songIndex'

const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export type SetHit = { setListId: string, songs: PlaylistRow[] }

export type JamHit = {
  jamSessionId: string
  setListId: string
  currentSong: number
  queue: number[]
  playlist?: PlaylistRow[]
  endDate?: number
}

export async function loadSetsAndJams(dynamo: DynamoDBClient) {
  const [setItems, jamItems] = await Promise.all([
    scanAll(dynamo, {
      TableName: SETLIST_TABLE_NAME,
      ProjectionExpression: 'setListId, songs',
    }),
    scanAll(dynamo, {
      TableName: JAM_TABLE_NAME,
      ProjectionExpression: 'jamSessionId, setListId, currentSong, #queue, playlist, endDate',
      ExpressionAttributeNames: { '#queue': 'queue' },
    }),
  ])

  const sets = new Map<string, PlaylistRow[]>()
  for (const item of setItems) {
    const row = unmarshall(item) as { setListId?: string, songs?: unknown }
    if (!row.setListId) continue
    sets.set(row.setListId, asPlaylist(row.songs))
  }

  const jams: JamHit[] = jamItems.flatMap((item) => {
    const row = unmarshall(item) as {
      jamSessionId?: string
      setListId?: string
      currentSong?: number
      queue?: number[]
      playlist?: unknown
      endDate?: number
    }
    if (!row.jamSessionId || !row.setListId) return []
    const playlist = Array.isArray(row.playlist) ? asPlaylist(row.playlist) : undefined
    return [{
      jamSessionId: row.jamSessionId,
      setListId: row.setListId,
      currentSong: typeof row.currentSong === 'number' ? row.currentSong : 0,
      queue: Array.isArray(row.queue) ? row.queue.map((n) => Number(n)).filter((n) => Number.isFinite(n)) : [],
      ...(playlist ? { playlist } : {}),
      ...(row.endDate ? { endDate: row.endDate } : {}),
    }]
  })

  return { sets, jams }
}

export function jamPlaylist(jam: JamHit, sets: Map<string, PlaylistRow[]>): PlaylistRow[] {
  if (jam.playlist) return jam.playlist
  return sets.get(jam.setListId) || []
}

export function setsContaining(sets: Map<string, PlaylistRow[]>, songId: string): SetHit[] {
  const hits: SetHit[] = []
  for (const [setListId, songs] of sets) {
    if (songs.some((row) => row.songId === songId)) hits.push({ setListId, songs })
  }
  return hits
}

export function jamsContaining(jams: JamHit[], sets: Map<string, PlaylistRow[]>, songId: string, openOnly: boolean): JamHit[] {
  return jams.filter((jam) => {
    if (openOnly && jam.endDate) return false
    return jamPlaylist(jam, sets).some((row) => row.songId === songId)
  })
}
