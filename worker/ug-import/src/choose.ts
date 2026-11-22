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

/** Title sent to Ultimate Guitar. Apostrophes are removed and accents are folded. */
export function titleSearchValue(title: string): string {
  const base = foldAccents(baseSongTitle(title)).replace(APOSTROPHES, '').replace(/\s+/g, ' ').trim()
  return base || foldAccents(title || '').replace(APOSTROPHES, '').trim()
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
    const folded = value.replace(/\s+/g, ' ').trim()
    if (folded && !values.some((item) => item.toLowerCase() === folded.toLowerCase())) values.push(folded)
  }
  for (const work of quotedWorks(title)) add(`${work} - ${base}`)
  add(base)
  const bare = foldAccents(bareSongTitle(title)).replace(APOSTROPHES, '').replace(/\s+/g, ' ').trim()
  if (bare.toLowerCase() !== base.toLowerCase()) add(bare)
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
  return { ...pool[0], fallback: matched.length === 0 }
}
