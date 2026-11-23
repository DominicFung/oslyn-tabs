/** Chord token, not a whole line. Shared by import cleanup and the tests. */
const ROOT = String.raw`[A-G](?:#|b|♯|♭)?`
const QUALITY = String.raw`(?:maj|min|dim|aug|sus|add|m|M|\+|ø|°)`
const EXT = String.raw`(?:(?:add|sus|maj|min|dim|aug|m|M)?(?:#|b|♯|♭)?\d+|\((?:#|b|♯|♭)?\d+\)|6\/9)`
export const CHORD_BODY = String.raw`(?:${ROOT}${QUALITY}?(?:6\/9|\d+)?(?:${EXT})*(?:\/${ROOT})?)`
export const chordTokenRegex = new RegExp(`^${CHORD_BODY}$`)
const NO_CHORD = /^(?:\(N\.?C\.?\)|N\.?C\.?)$/i

const FRET = /^(?:[xX\d]{4,6})(?:\(\d\))?$/
const TAB_LINE = /^[eEbBgGdDaA]\||\|[-0-9phbr/\\~xX]{4,}\|/
const RIFF_HEADER = /^\s*(?:guitar\s+\d+\s*:|.*\bplays for\b)/i
const PERF_NOTE = /\s*\((?:[^)]*\briff\b[^)]*|play riff[^)]*)\)/gi
const SETUP_LINE = /^\s*(?:(?:standard\s+)?tuning\b|capo\s*\d)/i

export function normalizeChordLine(line: string): string {
  return (line || '')
    .replace(/&ndash;|&mdash;|\u2013|\u2014/g, '-')
    .replace(/[|]/g, ' ')
    .replace(/-/g, ' ')
}

export function isNoChordToken(token: string): boolean {
  return NO_CHORD.test((token || '').trim())
}

export function isChordToken(token: string): boolean {
  const text = token.trim().replace(/[♯]/g, '#').replace(/[♭]/g, 'b')
  if (!text || isNoChordToken(text)) return false
  return chordTokenRegex.test(text)
}

export function isFretToken(token: string): boolean {
  return FRET.test(token.trim())
}

export function chordsOnLine(line: string): string[] {
  return normalizeChordLine(line)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => isChordToken(token))
}

export function isChordLine(line: string): boolean {
  if (isDiagramRow(line) || isTabLine(line)) return false
  const tokens = normalizeChordLine(line).trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return false
  if (tokens.every((token) => isNoChordToken(token))) return true
  let chords = 0
  let other = 0
  for (const token of tokens) {
    if (isNoChordToken(token)) continue
    if (isChordToken(token)) chords += 1
    else other += 1
  }
  return chords > 0 && chords >= other
}

export function isDiagramRow(line: string): boolean {
  const tokens = line.trim().split(/\s+/).filter(Boolean)
  return tokens.some((token) => isFretToken(token))
}

export function isChordKeyHeader(line: string): boolean {
  return /^\s*chords\s*:\s*$/i.test(line)
}

export function isTabLine(line: string): boolean {
  return TAB_LINE.test(line.trim())
}

export function isRiffHeader(line: string): boolean {
  return RIFF_HEADER.test(line.trim())
}

export function isPerformanceNote(line: string): boolean {
  const text = line.trim()
  if (!text) return false
  if (SETUP_LINE.test(text)) return true
  if (/^\(.*\)$/.test(text) && /\briff\b|play riff/i.test(text)) return true
  return false
}

export function stripPerformanceNote(line: string): string {
  return line.replace(PERF_NOTE, '').replace(/[ \t]+$/g, '')
}

export type ChartPhrase = { section: string, lyric: string, chords: string[] }

function sectionName(line: string): string | null {
  const text = stripPerformanceNote(line).trim()
  const match = text.match(/^\[([^\]]+)\]$/)
  return match ? match[1] : null
}

const META_LINE = /\b(?:based on|capo|tuning|tabbed by|transcribed by|version|strum(?:ming)?|bpm|tempo|difficulty|key\s*:|chords used|transpose)\b/i

export function isPureUrl(line: string): boolean {
  return /^(?:https?:\/\/|www\.)\S+$/i.test((line || '').trim())
}

function isHeaderLine(line: string): boolean {
  return sectionName(line) != null
}

/** Chordless credit, capo, tuning, or URL noise before the first chord. */
export function isLeadingMetaLine(line: string): boolean {
  const text = (line || '').trim()
  if (!text || isHeaderLine(text) || isChordLine(text)) return false
  return isPureUrl(text) || META_LINE.test(text)
}

function dropEmptySections(lines: string[]): string[] {
  const kept: string[] = []
  let i = 0
  while (i < lines.length) {
    if (!isHeaderLine(lines[i])) {
      kept.push(lines[i])
      i += 1
      continue
    }
    let j = i + 1
    while (j < lines.length && lines[j].trim() === '') j += 1
    if (j >= lines.length || isHeaderLine(lines[j])) {
      i = j
      continue
    }
    kept.push(lines[i])
    i += 1
  }
  return kept
}

/**
 * Songs with a [Section] header lose everything before that header.
 * Before the first chord, chordless URL and meta lines are dropped.
 * A line that is only a URL is dropped anywhere. Later chordless lyrics stay.
 */
export function stripSongMeta(lines: string[]): string[] {
  const hasHeader = lines.some((line) => isHeaderLine(line))
  let inSong = !hasHeader
  let seenChord = false
  const kept: string[] = []
  for (const line of lines) {
    if (!inSong) {
      if (isHeaderLine(line)) {
        inSong = true
        kept.push(line)
      }
      continue
    }
    if (isHeaderLine(line) || line.trim() === '') {
      kept.push(line)
      continue
    }
    if (isPureUrl(line)) continue
    if (!seenChord && isLeadingMetaLine(line)) continue
    if (isChordLine(line)) seenChord = true
    kept.push(line)
  }
  return dropEmptySections(kept)
}

/**
 * Drop chord diagrams, tab staves, riff headers, and riff instructions.
 * Chordless lyric lines stay. Section headers stay.
 */
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '...',
  ndash: '-', mdash: '-',
  lsquo: '\u2018', rsquo: '\u2019', sbquo: '\u201a',
  ldquo: '\u201c', rdquo: '\u201d', bdquo: '\u201e',
  aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', atilde: 'ã', aring: 'å', aelig: 'æ',
  ccedil: 'ç', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï', ntilde: 'ñ',
  oacute: 'ó', ograve: 'ò', ocirc: 'ô', ouml: 'ö', otilde: 'õ', oelig: 'œ',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü', yacute: 'ý', yuml: 'ÿ',
  Aacute: 'Á', Agrave: 'À', Acirc: 'Â', Auml: 'Ä', Atilde: 'Ã', Aring: 'Å', AElig: 'Æ',
  Ccedil: 'Ç', Eacute: 'É', Egrave: 'È', Ecirc: 'Ê', Euml: 'Ë',
  Iacute: 'Í', Igrave: 'Ì', Icirc: 'Î', Iuml: 'Ï', Ntilde: 'Ñ',
  Oacute: 'Ó', Ograve: 'Ò', Ocirc: 'Ô', Ouml: 'Ö', Otilde: 'Õ', OElig: 'Œ',
  Uacute: 'Ú', Ugrave: 'Ù', Ucirc: 'Û', Uuml: 'Ü', Yacute: 'Ý', Yuml: 'Ÿ',
}

/** Decode named and numeric HTML entities, including `&amp;rsquo;` written twice. Curly quotes stay curly. */
export function decodeEntities(value: string): string {
  let text = value || ''
  for (let pass = 0; pass < 3; pass++) {
    const next = text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body: string) => {
      if (body[0] === '#') {
        const code = body[1]?.toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
        return Number.isFinite(code) ? String.fromCodePoint(code) : entity
      }
      return NAMED_ENTITIES[body] ?? NAMED_ENTITIES[body.toLowerCase()] ?? entity
    })
    if (next === text) break
    text = next
  }
  return text
}

export function cleanChart(chart: string): string {
  const lines = decodeEntities(chart || '').replace(/\r/g, '').split('\n')
  const out: string[] = []
  let i = 0
  while (i < lines.length) {
    const raw = lines[i]
    if (isChordKeyHeader(raw)) {
      i += 1
      while (i < lines.length && (lines[i].trim() === '' || isDiagramRow(lines[i]))) i += 1
      continue
    }
    if (isRiffHeader(raw)) {
      i += 1
      while (i < lines.length && (lines[i].trim() === '' || isTabLine(lines[i]) || (isChordLine(lines[i]) && i + 1 < lines.length && isTabLine(lines[i + 1])))) {
        i += 1
      }
      continue
    }
    if (isTabLine(raw) || isDiagramRow(raw) || isPerformanceNote(raw)) {
      i += 1
      continue
    }
    const line = stripPerformanceNote(raw)
    if (line.trim() === '') {
      if (out.length > 0 && out[out.length - 1] !== '') out.push('')
    } else {
      out.push(line)
    }
    i += 1
  }
  return stripSongMeta(out).join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

/** Pair chord lines with the lyric under them, and keep every later chordless lyric. */
export function phrasesFromChart(chart: string): ChartPhrase[] {
  const lines = cleanChart(chart).split('\n')
  const phrases: ChartPhrase[] = []
  let section = ''
  for (let i = 0; i < lines.length; i++) {
    const header = sectionName(lines[i])
    if (header) {
      section = header
      continue
    }
    if (!lines[i].trim() || isDiagramRow(lines[i]) || isTabLine(lines[i]) || isPerformanceNote(lines[i])) continue
    if (isChordLine(lines[i])) {
      const lyric = i + 1 < lines.length && lines[i + 1].trim() && !isChordLine(lines[i + 1]) && !sectionName(lines[i + 1])
        ? lines[i + 1]
        : ''
      phrases.push({ section, lyric, chords: chordsOnLine(lines[i]) })
      continue
    }
    if (i > 0 && isChordLine(lines[i - 1])) continue
    phrases.push({ section, lyric: lines[i], chords: [] })
  }
  return phrases
}
