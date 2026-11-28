import { decodeEntities } from './ug'

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

/** ASCII apostrophe, curly quotes, and the modifier letter. Dropped, not turned into a space. */
const APOSTROPHES = /['’‘ʼ´]/g

/**
 * Ultimate Guitar's search JSON stores "É" as the letters "&Eacute;".
 * Decode that, then fold accents so "écrit", "ecrit", and "&Eacute;crit" compare equal.
 * œ and æ do not decompose under NFD, so they are spelled out first.
 */
export function foldAccents(value: string): string {
  return decodeEntities(value || '')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'Oe')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'Ae')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function normalizeName(value: string): string {
  return foldAccents(value)
    .replace(/\(ver\s*\d+\)/gi, ' ')
    .replace(APOSTROPHES, '')
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
/**
 * Re-record and vault tags. They are not the song.
 * "(10 Minute Version)" is not one of these.
 * "From The Vault" has no quotes, so it is not a From "X" work name.
 */
const RELEASE_TAG = String.raw`taylor'?s\s+version|taylors\s+version|from\s+the\s+vault|(?:the\s+)?vault(?:\s+track)?|re-?record(?:ed|ing)?`

function stripReleaseTags(title: string): string {
  const text = title.replace(APOSTROPHES, "'")
  return text
    .replace(new RegExp(String.raw`\s*[([]\s*(?:${RELEASE_TAG})\s*[)\]]`, 'gi'), ' ')
    .replace(new RegExp(String.raw`\s+-\s+(?:${RELEASE_TAG})\s*$`, 'i'), '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function baseSongTitle(value: string): string {
  let title = stripReleaseTags((value || '').replace(/[–—]/g, '-').trim())
  let previous = ''
  while (title && title !== previous) {
    previous = title
    title = stripReleaseTags(title)
      .replace(/\s*\(ver\s*\d+\)\s*$/i, '')
      .replace(/\s*[([]\s*(?:featuring|feat\.?|ft\.?)\s+[^)\]]*[)\]]\s*$/i, '')
      .replace(/\s+-\s+(?:featuring|feat\.?|ft\.?)\s+.*$/i, '')
      .replace(/\s+-\s+from\s+["“”][^"“”]+["“”](?:\s+soundtrack)?\s*$/i, '')
      .replace(/\s*[([]\s*from\s+["“”][^"“”]+["“”](?:\s+soundtrack)?\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+from\s+the\s+(?:\S+\s+){0,6}series\s*$/i, '')
      .replace(/\s+-\s+original\s+motion\s+picture\s+soundtrack\s*$/i, '')
      .replace(/\s*[([]\s*original\s+motion\s+picture\s+soundtrack\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+live(?:\s+version)?(?:\s+at\b.*)?$/i, '')
      .replace(/\s*[([]\s*live(?:\s+version)?(?:\s+at\b[^)\]]*)?\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?$/i, '')
      .replace(/\s*[([]\s*(?:\d{4}\s+)?remaster(?:ed)?(?:\s+\d{4})?\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+radio\s+edit$/i, '')
      .replace(/\s*[([]\s*radio\s+edit\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+acoustic(?:\s+version)?$/i, '')
      .replace(/\s*[([]\s*acoustic(?:\s+version)?\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+single\s+version$/i, '')
      .replace(/\s*[([]\s*single\s+version\s*[)\]]\s*$/i, '')
      .replace(/\s+-\s+mono(?:\s+version)?$/i, '')
      .replace(/\s*[([]\s*mono(?:\s+version)?\s*[)\]]\s*$/i, '')
      .trim()
  }
  return title
}

/** Title with release tags removed, then version notes such as "(10 Minute Version)" removed. */
export function bareSongTitle(value: string): string {
  let title = baseSongTitle(value)
  let previous = ''
  while (title && title !== previous) {
    previous = title
    title = title
      .replace(/\s*[([]\s*[^)\]]*(?:version|remix|mix|edit|demo)\s*[)\]]\s*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }
  return title
}

/** Work named in a Spotify `From "X"` suffix. Soundtrack after the quotes is not part of the name. */
export function quotedWorks(title: string): string[] {
  const works: string[] = []
  for (const match of (title || '').matchAll(/from\s+["“”]([^"“”]+)["“”]/gi)) {
    const work = match[1].replace(/\s+soundtrack\s*$/i, '').trim()
    if (work && !works.some((item) => item.toLowerCase() === work.toLowerCase())) works.push(work)
  }
  return works
}

/**
 * Characters that stay in a UG search query. Commas and hyphens stay:
 * dropping the comma in "I Knew It, I Knew You" makes UG return a different song.
 * Brackets and other punctuation become spaces so "(Sing Hallelujah)" is searchable.
 */
function searchQueryText(value: string): string {
  return foldAccents(value || '')
    .replace(APOSTROPHES, '')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[^\p{L}\p{N}\s,-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Title sent to Ultimate Guitar. Apostrophes, brackets, and punctuation are removed. Accents are folded. */
export function titleSearchValue(title: string): string {
  const base = searchQueryText(baseSongTitle(title))
  return base || searchQueryText(title || '')
}

/** Same title with parenthetical and bracketed parts removed, for example "(Sing Hallelujah)" or "(feat. X)". */
export function titleWithoutAsides(title: string): string {
  const stripped = baseSongTitle(title).replace(/\s*[([][^)\]]*[\])]\s*/g, ' ')
  return searchQueryText(stripped)
}

/**
 * `query` plus the primary artist. Used when a title search returns no Chords match.
 * The artist text is not punctuated away; only the title half is a search query.
 */
export function titleWithArtist(query: string, artist: string): string {
  const name = primaryArtist(artist).replace(/\s+/g, ' ').trim()
  const base = searchQueryText(query)
  if (!name) return base
  if (base.toLowerCase().endsWith(` ${name.toLowerCase()}`)) return base
  return `${base} ${name}`.replace(/\s+/g, ' ').trim()
}

/**
 * Search `X - Title` before the bare title. UG files "I Knew It, I Knew You - From \"Toy Story 5\""
 * as "Toy Story 5 - I Knew It, I Knew You", and the bare title is a different page.
 * The comma stays in the query: dropping it makes UG return a different song.
 */
export function titleSearchValues(title: string): string[] {
  const base = titleSearchValue(title)
  const values: string[] = []
  const add = (value: string) => {
    const folded = searchQueryText(value)
    if (folded && !values.some((item) => item.toLowerCase() === folded.toLowerCase())) values.push(folded)
  }
  for (const work of quotedWorks(title)) add(`${work} - ${base}`)
  add(base)
  // "(Sing Hallelujah)" is part of the title, not a Spotify suffix. If the full
  // query has no Chords match, search again with that aside removed.
  const dropped = titleWithoutAsides(title)
  if (dropped.toLowerCase() !== base.toLowerCase()) add(dropped)
  const bare = searchQueryText(bareSongTitle(title))
  if (bare.toLowerCase() !== base.toLowerCase()) add(bare)
  return values
}

/**
 * Title queries first, then each of those with the primary artist appended.
 * The artist queries are fallbacks for when the title search has no Chords match.
 */
export function chordSearchQueries(title: string, artist: string): string[] {
  const titles = titleSearchValues(title)
  const values = [...titles]
  for (const query of titles) {
    const withArtist = titleWithArtist(query, artist)
    if (withArtist.toLowerCase() !== query.toLowerCase() && !values.some((item) => item.toLowerCase() === withArtist.toLowerCase())) {
      values.push(withArtist)
    }
  }
  return values
}

/**
 * Used when the plain search has no artist match.
 * "High School Musical 2 - Bet On It" is not on that search page; "Bet On It soundtrack" is.
 */
export function soundtrackSearchValues(title: string): string[] {
  const base = titleSearchValue(title)
  const values: string[] = []
  const add = (value: string) => {
    const folded = value.replace(/\s+/g, ' ').trim()
    if (!folded || folded.toLowerCase() === base.toLowerCase()) return
    if (!values.some((item) => item.toLowerCase() === folded.toLowerCase())) values.push(folded)
  }
  add(`${base} soundtrack`)
  const parts = base.split(/\s+-\s+/)
  if (parts.length >= 2) {
    const song = parts[parts.length - 1].trim()
    if (song) {
      add(`${song} soundtrack`)
      add(song)
    }
  }
  return values
}

export function songTitleKey(value: string): string {
  return normalizeName(baseSongTitle(value))
}

/**
 * A one-word title such as "Home" is too generic to treat as part of a longer song.
 * "Mon Soleil" is specific enough to match "Emily In Paris - Mon Soleil".
 */
function allowsContainsMatch(baseKey: string): boolean {
  return baseKey.split(' ').filter(Boolean).length >= 2
}

function workKey(work: string): string {
  return normalizeName(work)
}

/** True when the UG title contains the movie or show named in From "X", as whole words. */
export function coversQuotedWork(songName: string, spotifyTitle: string): boolean {
  const haystack = ` ${songTitleKey(songName)} `
  return quotedWorks(spotifyTitle).some((work) => {
    const key = workKey(work)
    if (key.split(' ').filter(Boolean).length < 2) return false
    return haystack.includes(` ${key} `)
  })
}

const MISC_CREDIT = /^(?:misc )?(?:cartoons|soundtrack|television)$/

/** "High School Musical 2 - Bet On It" is the movie form of "Bet On It". */
export function movieTitleMatch(songName: string, spotifyTitle: string): boolean {
  const parts = (songName || '').split(/\s+-\s+/)
  if (parts.length < 2) return false
  const want = songTitleKey(spotifyTitle)
  if (!allowsContainsMatch(want)) return false
  return songTitleKey(parts[parts.length - 1]) === want
}

export function isMiscCredit(artist: string): boolean {
  return artistNames(artist).some((name) => MISC_CREDIT.test(name))
}

function miscWorkCredit(ugArtist: string, ugTitle: string, spotifyTitle: string): boolean {
  if (!coversQuotedWork(ugTitle, spotifyTitle)) return false
  return artistNames(ugArtist).some((name) => MISC_CREDIT.test(name))
}

export function titleContainsBase(candidate: string, baseKey: string): boolean {
  if (!allowsContainsMatch(baseKey)) return false
  const haystack = songTitleKey(candidate)
  if (!haystack || haystack === baseKey) return false
  return ` ${haystack} `.includes(` ${baseKey} `)
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
  const prepared = foldAccents(value)
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
 * Exact title first, then any credited artist, then Chords, then the highest rating count.
 * If no artist matches, the highest-rated title match is used and marked fallback.
 * A whole-word title inside a longer UG title is used only when nothing matches exactly,
 * and only when the base title is more than one word.
 */
export function chooseResult(results: UgResult[], title: string, artist: string): ChosenResult | null {
  const wantTitle = songTitleKey(title)
  const chords = results.filter((row) => isChordChart(row.type))
  const exact = chords.filter((row) => songTitleKey(row.songName) === wantTitle)
  let poolSource = exact.length
    ? exact
    : chords.filter((row) => titleContainsBase(row.songName, wantTitle))
  if (poolSource.length === 0) {
    const bare = normalizeName(bareSongTitle(title))
    if (bare && bare !== wantTitle) {
      poolSource = chords.filter((row) => songTitleKey(row.songName) === bare)
    }
  }
  if (poolSource.length === 0) return null
  const withWork = poolSource.filter((row) => coversQuotedWork(row.songName, title))
  if (withWork.length) poolSource = withWork
  const matched = artistNames(artist).length
    ? poolSource.filter((row) => artistsOverlap(artist, row.artistName) || miscWorkCredit(row.artistName, row.songName, title))
    : []
  const pool = matched.length ? matched : poolSource
  pool.sort((a, b) => b.votes - a.votes || b.rating - a.rating)
  if (matched.length === 0) {
    const soundtrack = chords
      .filter((row) => movieTitleMatch(row.songName, title) && isMiscCredit(row.artistName))
      .sort((a, b) => b.votes - a.votes || b.rating - a.rating)
    const fallback = pool[0]
    if (soundtrack.length && fallback && soundtrack[0].votes > fallback.votes) {
      return { ...soundtrack[0], fallback: false }
    }
  }
  return { ...pool[0], fallback: matched.length === 0 }
}
