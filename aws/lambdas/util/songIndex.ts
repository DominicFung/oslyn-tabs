export type PlaylistRow = { songId: string, key: string, order?: number }

export function rowSongId(row: unknown): string {
  if (!row || typeof row !== 'object') return ''
  const value = row as { songId?: unknown, song?: { songId?: unknown } }
  if (typeof value.songId === 'string') return value.songId
  if (typeof value.song?.songId === 'string') return value.song.songId
  return ''
}

export function asPlaylist(value: unknown): PlaylistRow[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((row) => {
    const songId = rowSongId(row)
    if (!songId) return []
    const key = row && typeof row === 'object' && typeof (row as { key?: unknown }).key === 'string'
      ? (row as { key: string }).key
      : 'C'
    const order = row && typeof row === 'object' ? (row as { order?: unknown }).order : undefined
    return [{ songId, key: key || 'C', ...(typeof order === 'number' ? { order } : {}) }]
  })
}

export function indexesOf(rows: PlaylistRow[], songId: string): number[] {
  const at: number[] = []
  rows.forEach((row, index) => { if (row.songId === songId) at.push(index) })
  return at
}

export function withoutIndexes<T>(rows: T[], removeAt: number[]): T[] {
  const drop = new Set(removeAt)
  return rows.filter((_, index) => !drop.has(index))
}

/** Drop removed positions and shift later indexes down. */
export function remapIndexes(indexes: number[], removeAt: number[]): number[] {
  const drop = new Set(removeAt)
  return indexes
    .filter((index) => Number.isFinite(index) && !drop.has(index))
    .map((index) => index - removeAt.filter((removed) => removed < index).length)
}

/**
 * If the current song was removed, stay on the same index so the next song
 * slides into place. If it was the last song, land on the new last song.
 */
export function remapCurrent(current: number, removeAt: number[], newLength: number): number {
  if (newLength <= 0) return 0
  const sorted = [...removeAt].sort((a, b) => a - b)
  let removedBefore = 0
  let removedCurrent = false
  for (const index of sorted) {
    if (index < current) removedBefore += 1
    else if (index === current) removedCurrent = true
  }
  let next = current - removedBefore
  if (removedCurrent) next = Math.min(next, newLength - 1)
  if (next >= newLength) return newLength - 1
  if (next < 0) return 0
  return next
}
