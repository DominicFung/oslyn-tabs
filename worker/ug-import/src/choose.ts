export type UgResult = {
  songName: string
  artistName: string
  type: string
  votes: number
  rating: number
  tabUrl: string
  version: number
}

export type ChosenResult = UgResult & { fallback: boolean }

export function normalizeName(value: string): string {
  return (value || '')
    .replace(/\(ver\s*\d+\)/gi, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

function stripAccents(value: string): string {
  return (value || '').normalize('NFD').replace(/\p{M}/gu, '')
}

/** First credited name, before a comma. "Luis Fonsi, Daddy Yankee" → "Luis Fonsi". */
export function primaryArtist(artist: string): string {
  return (artist || '').split(',')[0].trim()
}

/**
 * Split a credit list the way Spotify and Ultimate Guitar write it:
 * commas, feat./ft./featuring, &, and, x. Then ignore case, accents, and a leading "The ".
 */
export function artistNames(value: string): string[] {
  const prepared = stripAccents(value)
    .replace(/\bfeaturing\b/gi, ',')
    .replace(/\bfeat\.?\b/gi, ',')
    .replace(/\bft\.?\b/gi, ',')
    .replace(/\band\b/gi, ',')
    .replace(/\bx\b/gi, ',')
    .replace(/&/g, ',')
  const seen = new Set<string>()
  for (const part of prepared.split(/[,/]/)) {
    const name = normalizeName(part).replace(/^the /, '')
    if (name) seen.add(name)
  }
  return [...seen]
}

export function artistsOverlap(spotifyArtists: string, ugArtist: string): boolean {
  const ug = new Set(artistNames(ugArtist))
  if (ug.size === 0) return false
  return artistNames(spotifyArtists).some((name) => ug.has(name))
}

/** Chords only. Tabs, bass, ukulele, pro, official, and video are not a match. */
export function isChordChart(type: string): boolean {
  return (type || '').trim().toLowerCase() === 'chords'
}

/**
 * Title match, then any credited artist, then Chords, then the highest rating count.
 * If no artist matches, the highest-rated title match is used and marked fallback.
 */
export function chooseResult(results: UgResult[], title: string, artist: string): ChosenResult | null {
  const wantTitle = normalizeName(title)
  const chords = results.filter((row) =>
    normalizeName(row.songName) === wantTitle && isChordChart(row.type)
  )
  if (chords.length === 0) return null
  const matched = artistNames(artist).length
    ? chords.filter((row) => artistsOverlap(artist, row.artistName))
    : []
  const pool = matched.length ? matched : chords
  pool.sort((a, b) => b.votes - a.votes || b.rating - a.rating)
  return { ...pool[0], fallback: matched.length === 0 }
}
