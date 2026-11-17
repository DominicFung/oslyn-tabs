"use client"

export type ChordImportRequest = {
  songId: string
  jamSessionId: string
  title: string
  artist?: string | null
  userId: string
}

export function ultimateGuitarSearchUrl(title: string, artist?: string | null) {
  const q = encodeURIComponent(`${title} ${artist || ''}`.trim())
  return `https://www.ultimate-guitar.com/search.php?search_type=title&value=${q}`
}

/** Tells the Oslyn extension which song to fill, then opens an Ultimate Guitar search. */
export function requestChordImport(detail: ChordImportRequest) {
  window.dispatchEvent(new CustomEvent('oslyn-import-chords', { detail }))
  window.open(ultimateGuitarSearchUrl(detail.title, detail.artist), '_blank', 'noopener,noreferrer')
}
