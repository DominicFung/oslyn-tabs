import { asPlaylist, PlaylistRow } from './songIndex'

/**
 * The songs actually in the room. A playlist attribute, including an empty one,
 * replaces the set. Otherwise the set is the live list.
 */
export function liveJamRows(
  setSongs: { songId?: string | null, key?: string | null }[] | null | undefined,
  playlist: unknown,
): PlaylistRow[] {
  if (Array.isArray(playlist)) return asPlaylist(playlist)
  return (setSongs || []).flatMap((row) => {
    if (!row?.songId) return []
    return [{ songId: row.songId, key: row.key || 'C' }]
  })
}

/**
 * Where a song sits in the live jam. The playlist counts, and so does a queue
 * index that points at the song. This does not decide who may edit the jam.
 */
export function findLiveJamSong(input: {
  songId: string
  setSongs?: { songId?: string | null, key?: string | null }[] | null
  playlist?: unknown
  queue?: unknown
}): { index: number, key: string } | null {
  if (!input.songId) return null
  const live = liveJamRows(input.setSongs, input.playlist)
  const direct = live.findIndex((row) => row.songId === input.songId)
  if (direct >= 0) return { index: direct, key: live[direct].key || 'C' }
  if (!Array.isArray(input.queue)) return null
  for (const entry of input.queue) {
    const index = typeof entry === 'number' ? entry : Number(entry)
    if (!Number.isInteger(index) || index < 0 || index >= live.length) continue
    if (live[index].songId === input.songId) return { index, key: live[index].key || 'C' }
  }
  return null
}
