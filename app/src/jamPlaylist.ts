export type PlaylistSong = {
  songId?: string | null
  title?: string | null
  artist?: string | null
  album?: string | null
  albumCover?: string | null
  chordSheet?: string | null
  chordSheetKey?: string | null
  spotifyId?: string | null
}

export type PlaylistRow = {
  key: string
  song: PlaylistSong
  order?: number | null
}

export type JamSongChange = {
  jamSessionId?: string | null
  index?: number | null
  key?: string | null
  jumpTo?: boolean | null
  song?: PlaylistSong | null
}

export type PlaylistUpdate = {
  songId?: string | null
  title?: string | null
  currentSong?: number | null
  queue?: Array<number | null> | null
  songIds?: Array<string | null> | null
}

export function orderSongs<T extends { song?: { songId?: string | null } | null }>(
  prev: T[],
  songIds: Array<string | null> | null | undefined,
): T[] {
  const pools = new Map<string, T[]>()
  for (const row of prev) {
    const id = row?.song?.songId
    if (!id) continue
    const list = pools.get(id) || []
    list.push(row)
    pools.set(id, list)
  }
  const next: T[] = []
  for (const id of songIds || []) {
    if (!id) continue
    const row = pools.get(id)?.shift()
    if (row) next.push(row)
  }
  return next
}

/** Keep an existing chart when a live-jam event arrives without one. */
export function mergeSongChange<T extends PlaylistRow>(prev: T[], change: JamSongChange | null | undefined): T[] {
  if (!change?.song?.songId || change.index == null) return prev
  const incoming = change.song
  const existing = prev.findIndex((row) => row?.song?.songId === incoming.songId)
  if (existing >= 0) {
    const copy = [...prev]
    const current = copy[existing]
    copy[existing] = {
      ...current,
      key: change.key || current.key,
      song: {
        ...current.song,
        ...incoming,
        chordSheet: incoming.chordSheet?.trim() || current.song.chordSheet || '',
        chordSheetKey: incoming.chordSheetKey || current.song.chordSheetKey,
      },
    }
    return copy
  }
  const entry = {
    key: change.key || 'C',
    order: change.index,
    song: { ...incoming, chordSheet: incoming.chordSheet || '' },
  } as T
  if (change.index === prev.length) return [...prev, entry]
  if (change.index >= 0 && change.index < prev.length) {
    const copy = [...prev]
    copy[change.index] = entry
    return copy
  }
  return [...prev, entry]
}

export function withImportedSheet<T extends PlaylistRow>(prev: T[], songId: string, chordSheet: string): T[] {
  const sheet = chordSheet.trim()
  if (!songId || !sheet) return prev
  return prev.map((row) => row.song?.songId === songId
    ? { ...row, song: { ...row.song, chordSheet: sheet, chordSheetKey: row.song.chordSheetKey || 'C' } }
    : row)
}

export function appendQueue(queue: Array<number | null> | null | undefined, index: number): number[] {
  const base = (queue || []).filter((n): n is number => typeof n === 'number' && n >= 0)
  return [...base, index]
}

export const FEW_LIBRARY_MATCHES = 3

export function shouldSearchSpotify(
  canAdd: boolean,
  term: string,
  libraryState: 'idle' | 'loading' | 'done' | 'error',
  libraryCount: number,
) {
  if (!canAdd) return false
  if (term.trim().length < 2) return false
  if (libraryState === 'loading' || libraryState === 'idle') return false
  if (libraryState === 'done' && libraryCount >= FEW_LIBRARY_MATCHES) return false
  return true
}

export function chordSiteLinks(query: string) {
  const q = encodeURIComponent(query.trim())
  return {
    ultimateGuitar: `https://www.ultimate-guitar.com/search.php?search_type=title&value=${q}`,
    worshipTogether: `https://www.worshiptogether.com/search-results/#?cludoquery=${q}`,
  }
}

export function ultimateGuitarSearchUrl(title: string, artist?: string | null) {
  const q = encodeURIComponent(`${title} ${artist || ''}`.trim())
  return `https://www.ultimate-guitar.com/search.php?search_type=title&value=${q}`
}

export function spotifyTrackUrl(spotifyId: string) {
  return `https://open.spotify.com/track/${encodeURIComponent(spotifyId)}`
}
