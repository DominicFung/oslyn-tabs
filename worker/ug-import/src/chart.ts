/** Chord token, not a whole line. Shared by import cleanup and the tests. */
const ROOT = String.raw`[A-G](?:#|b|♯|♭)?`
const QUALITY = String.raw`(?:maj|min|dim|aug|sus|add|m|M|\+|ø|°)`
const EXT = String.raw`(?:(?:add|sus|maj|min|dim|aug|m|M)?(?:#|b|♯|♭)?\d+|\((?:#|b|♯|♭)?\d+\)|6\/9)`
export const CHORD_BODY = String.raw`(?:N\.?C\.?|${ROOT}${QUALITY}?(?:6\/9|\d+)?(?:${EXT})*(?:\/${ROOT})?)`
export const chordTokenRegex = new RegExp(`^${CHORD_BODY}$`)

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

export function isChordToken(token: string): boolean {
  const text = token.trim().replace(/[♯]/g, '#').replace(/[♭]/g, 'b')
  if (!text) return false
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
  let chords = 0
  let other = 0
  for (const token of tokens) {
    if (isChordToken(token)) chords += 1
    else if (isFretToken(token) || /^or$/i.test(token)) other += 1
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

/**
 * Drop chord diagrams, tab staves, riff headers, and riff instructions.
 * Chordless lyric lines stay. Section headers stay.
 */
export function cleanChart(chart: string): string {
  const lines = (chart || '').replace(/\r/g, '').split('\n')
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
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
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
