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

/**
 * Spotify version suffixes that are not part of the song title.
 * "No Other Name - Live" and "No Other Name (feat. Someone)" both become "No Other Name".
 * The stored song title is left unchanged; this is only for search and matching.
 */
export function baseSongTitle(value: string): string {
  let title = (value || '').replace(/[–—]/g, '-').trim()
  let previous = ''
  while (title && title !== previous) {
    previous = title
    title = title
      .replace(/\s*\(ver\s*\d+\)\s*$/i, '')
      .replace(/\s*[([]\s*(?:featuring|feat\.?|ft\.?)\s+[^)\]]*[)\]]\s*$/i, '')
      .replace(/\s+-\s+(?:featuring|feat\.?|ft\.?)\s+.*$/i, '')
      .replace(/\s+-\s+live(?:\s+version)?(?:\s+at\b.*)?$/i, '')
      .replace(/\s*[([]\s*live(?:\s+version)?(?:\s+at\b[^)\]]*)?\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+remastered(?:\s+\d{4})?$/i, '')
      .replace(/\s*[([]\s*remastered(?:\s+\d{4})?\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+radio\s+edit$/i, '')
      .replace(/\s*[([]\s*radio\s+edit\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+acoustic(?:\s+version)?$/i, '')
      .replace(/\s*[([]\s*acoustic(?:\s+version)?\s*[)\]]\s*$/i, '')
      .trim()
  }
  return title
}

/** Title sent to Ultimate Guitar. Falls back to the original when stripping leaves nothing. */
export function titleSearchValue(title: string): string {
  const base = baseSongTitle(title).trim()
  return base || (title || '').trim()
}

export function songTitleKey(value: string): string {
  return normalizeName(baseSongTitle(value))
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
  const wantTitle = songTitleKey(title)
  const chords = results.filter((row) =>
    songTitleKey(row.songName) === wantTitle && isChordChart(row.type)
  )
  if (chords.length === 0) return null
  const matched = artistNames(artist).length
    ? chords.filter((row) => artistsOverlap(artist, row.artistName))
    : []
  const pool = matched.length ? matched : chords
  pool.sort((a, b) => b.votes - a.votes || b.rating - a.rating)
  return { ...pool[0], fallback: matched.length === 0 }
}
