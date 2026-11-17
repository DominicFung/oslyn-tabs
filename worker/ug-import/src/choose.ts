export type UgResult = {
  songName: string
  artistName: string
  type: string
  votes: number
  rating: number
  tabUrl: string
  version: number
}

export function normalizeName(value: string): string {
  return (value || '')
    .replace(/\(ver\s*\d+\)/gi, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Chords only. Tabs, bass, ukulele, pro, official, and video are not a match. */
export function isChordChart(type: string): boolean {
  return (type || '').trim().toLowerCase() === 'chords'
}

/**
 * Title match, then artist match, then Chords, then the highest rating count.
 */
export function chooseResult(results: UgResult[], title: string, artist: string): UgResult | null {
  const wantTitle = normalizeName(title)
  const wantArtist = normalizeName(artist)
  const matches = results.filter((row) =>
    normalizeName(row.songName) === wantTitle
    && normalizeName(row.artistName) === wantArtist
    && isChordChart(row.type)
  )
  if (matches.length === 0) return null
  matches.sort((a, b) => b.votes - a.votes || b.rating - a.rating)
  return matches[0]
}
