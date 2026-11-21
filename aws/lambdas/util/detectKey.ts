/**
 * Detect a song key from a chord sheet.
 * Chord tokens follow the same shape as web/core/oslyn.ts (`chordRegex`),
 * and Ultimate Guitar [ch] tags are read before that.
 * Key names match the transpose UI: C C# D Eb E F F# G Ab A Bb B, plus a trailing m.
 */

const USUAL = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }

const SECTION = /^(verse|chorus|bridge|intro|outro|pre-?chorus|instrumental|interlude|tag|ending|hook|refrain|coda|solo|break|vamp|note|capo)\b/i

/** Same token the player uses, plus the sevenths and alterations those charts actually contain. */
const CHORD_TOKEN = /^[A-Ga-g](?:#|b|♯|♭)?(?:##|bb)?(?:m|M|maj|min|dim|aug|sus|add|°|ø|\+|-)?[0-9]{0,2}(?:sus[24]?|add[0-9]{0,2}|maj7|m7b5|b5|b9|#9|#11|b13)?[0-9]{0,2}(?:\/[A-Ga-g](?:#|b|♯|♭)?)?$/

export type DetectedKey = { key: string, confidence: number }

type Quality = 'maj' | 'min' | 'dim' | 'half' | 'aug'

type ParsedChord = { pc: number, quality: Quality, accidental: '#' | 'b' | '' }

type Role = 'tonic' | 'dominant' | 'subdominant' | 'diatonic' | 'borrowed'

const ROLE_WEIGHT: Record<Role, number> = {
  tonic: 2,
  dominant: 1.5,
  subdominant: 1.5,
  diatonic: 1,
  borrowed: 0.45,
}

function pitchOf(letter: string, marks: string): { pc: number, accidental: '#' | 'b' | '' } | null {
  const base = PITCH[letter.toUpperCase()]
  if (base == null) return null
  let acc = 0
  let accidental: '#' | 'b' | '' = ''
  const normalized = marks.replace(/♯/g, '#').replace(/♭/g, 'b')
  for (const mark of normalized) {
    if (mark === '#') { acc += 1; accidental = '#' }
    else if (mark === 'b') { acc -= 1; accidental = 'b' }
  }
  if (normalized.includes('#') && normalized.includes('b')) accidental = normalized.indexOf('#') > normalized.indexOf('b') ? '#' : 'b'
  return { pc: (base + acc + 120) % 12, accidental }
}

export function parseChordSymbol(symbol: string): ParsedChord | null {
  const trimmed = symbol.trim().replace(/[()[\]]/g, '')
  if (!trimmed || /^(n\.?c\.?|x|rest|%)$/i.test(trimmed)) return null
  const body = trimmed.split('/')[0]
  const match = body.match(/^([A-Ga-g])((?:#|b|♯|♭)+)?(.*)$/)
  if (!match) return null
  const root = pitchOf(match[1], match[2] || '')
  if (!root) return null
  const rest = (match[3] || '').replace(/°/g, 'dim').replace(/ø/g, 'half')
  if (!/^(?:m7b5|min7b5|half-?dim|maj7|ma7|min7|m7|sus2|sus4|sus|add\d{0,2}|dim7|dim|aug|maj|min|m|M|[2-9]|6|7|9|11|13)?(?:b5)?$/i.test(rest)) {
    return null
  }
  const mark = rest.toLowerCase()
  let quality: Quality = 'maj'
  if (/m7b5|min7b5|half/.test(mark)) quality = 'half'
  else if (/dim/.test(mark)) quality = 'dim'
  else if (/aug/.test(mark)) quality = 'aug'
  else if (/maj/.test(mark)) quality = 'maj'
  else if (/min|^m/.test(mark)) quality = 'min'
  return { pc: root.pc, quality, accidental: root.accidental }
}

function isMajFamily(quality: Quality): boolean {
  return quality === 'maj' || quality === 'aug'
}

function roleInMajor(chord: ParsedChord, tonic: number): Role | null {
  const rel = (chord.pc - tonic + 12) % 12
  if (rel === 0 && isMajFamily(chord.quality)) return 'tonic'
  if (rel === 7 && isMajFamily(chord.quality)) return 'dominant'
  if (rel === 5 && isMajFamily(chord.quality)) return 'subdominant'
  if (rel === 2 && chord.quality === 'min') return 'diatonic'
  if (rel === 4 && chord.quality === 'min') return 'diatonic'
  if (rel === 9 && chord.quality === 'min') return 'diatonic'
  if (rel === 11 && (chord.quality === 'dim' || chord.quality === 'half')) return 'diatonic'
  if (rel === 10 && isMajFamily(chord.quality)) return 'borrowed'
  return null
}

function roleInMinor(chord: ParsedChord, tonic: number): Role | null {
  const rel = (chord.pc - tonic + 12) % 12
  if (rel === 0 && chord.quality === 'min') return 'tonic'
  if (rel === 7 && isMajFamily(chord.quality)) return 'dominant'
  if (rel === 5 && chord.quality === 'min') return 'subdominant'
  if (rel === 7 && chord.quality === 'min') return 'diatonic'
  if (rel === 3 && isMajFamily(chord.quality)) return 'diatonic'
  if (rel === 8 && isMajFamily(chord.quality)) return 'diatonic'
  if (rel === 10 && isMajFamily(chord.quality)) return 'diatonic'
  if (rel === 2 && (chord.quality === 'dim' || chord.quality === 'half')) return 'diatonic'
  if (rel === 11 && (chord.quality === 'dim' || chord.quality === 'half')) return 'diatonic'
  return null
}

function stripNonMusic(sheet: string): string {
  return sheet
    .replace(/\r/g, '')
    .replace(/\[tab\][\s\S]*?\[\/tab\]/gi, '\n')
    .replace(/\{start_of_tab\}[\s\S]*?\{end_of_tab\}/gi, '\n')
    .split('\n')
    .filter((line) => !/^\s*capo\b/i.test(line) && !/\(.*\bcapo\b.*\)/i.test(line))
    .join('\n')
}

function acceptToken(token: string): ParsedChord | null {
  const cleaned = token.trim().replace(/^\[|\]$/g, '')
  if (!cleaned || SECTION.test(cleaned)) return null
  if (!CHORD_TOKEN.test(cleaned) && !/^[A-Ga-g][#b♯♭]?m?7?b5?$/.test(cleaned)) {
    const parsed = parseChordSymbol(cleaned)
    if (!parsed) return null
    return parsed
  }
  return parseChordSymbol(cleaned)
}

/** Chords in sheet order. [ch] tags and bracketed chords win, then the player regex. */
export function chordsInSheet(sheet: string): ParsedChord[] {
  if (!sheet?.trim()) return []
  const found: ParsedChord[] = []
  const source = stripNonMusic(sheet)
  const consumed = source
    .replace(/\[ch\]([\s\S]*?)\[\/ch\]/gi, (_all, inner: string) => {
      const parsed = acceptToken(inner)
      if (parsed) found.push(parsed)
      return ' '
    })
    .replace(/\[([^\]]+)\]/g, (_all, inner: string) => {
      const parsed = acceptToken(inner)
      if (parsed) found.push(parsed)
      return ' '
    })
  for (const line of consumed.split('\n')) {
    const tokens = line.trim().split(/\s+/).filter(Boolean)
    if (tokens.length === 0) continue
    const parsed = tokens.map((token) => acceptToken(token))
    const chords = parsed.filter((chord): chord is ParsedChord => !!chord)
    if (chords.length === 0 || chords.length < tokens.length - chords.length) continue
    found.push(...chords)
  }
  return found
}

function spell(pc: number, minor: boolean, preference: '#' | 'b' | ''): string {
  const names = preference === '#' ? SHARP : preference === 'b' ? FLAT : USUAL
  return `${names[pc]}${minor ? 'm' : ''}`
}

function tonicEvidence(chords: ParsedChord[], tonic: number, minor: boolean): number {
  let score = 0
  const hits = (chord: ParsedChord | undefined) => {
    if (!chord || chord.pc !== tonic) return 0
    return minor ? (chord.quality === 'min' ? 2 : 0) : (isMajFamily(chord.quality) ? 2 : 0)
  }
  score += hits(chords[0])
  score += hits(chords[chords.length - 1])
  if (chords.some((chord) => chord.pc === tonic && (minor ? chord.quality === 'min' : isMajFamily(chord.quality)))) score += 1
  return score
}

export function detectKey(sheet: string): DetectedKey | null {
  const chords = chordsInSheet(sheet)
  if (chords.length === 0) return null
  const weights = chords.map(() => 1)
  weights[0] += 2
  weights[weights.length - 1] += 2
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  let sharps = 0
  let flats = 0
  for (const chord of chords) {
    if (chord.accidental === '#') sharps += 1
    else if (chord.accidental === 'b') flats += 1
  }
  const preference: '#' | 'b' | '' = sharps > flats ? '#' : flats > sharps ? 'b' : ''

  const scored = []
  for (let pc = 0; pc < 12; pc += 1) {
    for (const minor of [false, true]) {
      let score = 0
      for (let i = 0; i < chords.length; i += 1) {
        const role = minor ? roleInMinor(chords[i], pc) : roleInMajor(chords[i], pc)
        if (role) score += weights[i] * ROLE_WEIGHT[role]
      }
      scored.push({ pc, minor, score })
    }
  }
  scored.sort((a, b) => b.score - a.score)
  let best = scored[0]
  const relativePc = best.minor ? (best.pc + 3) % 12 : (best.pc + 9) % 12
  const relative = scored.find((row) => row.pc === relativePc && row.minor !== best.minor)
  if (relative && relative.score >= best.score * 0.85) {
    const major = best.minor ? relative : best
    const minor = best.minor ? best : relative
    const majorEvidence = tonicEvidence(chords, major.pc, false)
    const minorEvidence = tonicEvidence(chords, minor.pc, true)
    best = minorEvidence > majorEvidence ? minor : major
  }
  if (best.score <= 0) return null
  const confidence = Math.round(Math.min(1, best.score / (totalWeight * 2)) * 1000) / 1000
  return { key: spell(best.pc, best.minor, preference), confidence }
}

/**
 * There is no stored flag for a hand-picked key. chordSheetKey is just a string,
 * and several creators store "C" when they do not know the key yet.
 * Import saves replace that. Every other save keeps a key that is already present.
 */
export function resolvedChordSheetKey(input: {
  chordSheet?: string | null
  currentKey?: string | null
  providedKey?: string | null
  importPath: boolean
}): string | undefined {
  const detected = input.chordSheet?.trim() ? detectKey(input.chordSheet) : null
  if (!detected) return undefined
  const provided = input.providedKey?.trim() || ''
  const current = input.currentKey?.trim() || ''
  if (input.importPath) return detected.key
  if (!provided && !current) return detected.key
  return undefined
}
