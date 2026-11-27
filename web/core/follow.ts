/** One chart chord, in page order. `page` is the slide index the chord is printed on. */
export type FollowChord = {
  symbol: string
  page: number
  line: number
  template: number[]
}

export type FollowSnapshot = {
  index: number
  page: number
  line: number
  detected: string
  matched: string
  confidence: number
  /** Semitones the sounding audio sits above the chart. Capo 2 locks to 2. */
  transposition: number
  transpositionLocked: boolean
  /** Next jam page to request, or null when the estimate should not turn. */
  turnTo: number | null
}

export type ScoreFollowerOptions = {
  /** Voiced time before the transposition search locks. Tests use 0. */
  calibrationMs?: number
  turnConfidence?: number
  /** Consecutive voiced frames that must agree before a page turn. */
  turnHold?: number
  silenceRms?: number
}

const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const MAJ: Array<[number, number]> = [[0, 1], [4, 0.85], [7, 1]]
const MIN: Array<[number, number]> = [[0, 1], [3, 0.85], [7, 1]]
const DOM7: Array<[number, number]> = [[0, 1], [4, 0.75], [7, 0.9], [10, 0.75]]
const MAJ7: Array<[number, number]> = [[0, 1], [4, 0.75], [7, 0.9], [11, 0.7]]
const MIN7: Array<[number, number]> = [[0, 1], [3, 0.75], [7, 0.9], [10, 0.75]]
const SUS2: Array<[number, number]> = [[0, 1], [2, 0.85], [7, 1]]
const SUS4: Array<[number, number]> = [[0, 1], [5, 0.85], [7, 1]]
const DIM: Array<[number, number]> = [[0, 1], [3, 0.85], [6, 0.95]]
const AUG: Array<[number, number]> = [[0, 1], [4, 0.85], [8, 0.95]]
const ROOT5: Array<[number, number]> = [[0, 1], [7, 1]]

const QUALITY_SUFFIX = ['', 'm', '7', 'maj7', 'm7', 'sus2', 'sus4', 'dim', 'aug'] as const

type ChartChord = {
  chord: number
  isMinor: boolean
  decorator?: string | null
}

/**
 * Ordered chords for a parsed slide deck. Heads-up `extra` lines are the next
 * page's first line, so they are not repeated here.
 */
export function sequenceFromSlides(
  slides: { pages: Array<{ lines: Array<{ chords?: ChartChord[] | null }> }> },
  key: string,
  chordName: (chord: number, isMinor: boolean, key: string) => string | null,
): FollowChord[] {
  const out: FollowChord[] = []
  slides.pages.forEach((page, pageIndex) => {
    page.lines.forEach((line, lineIndex) => {
      for (const chord of line.chords || []) {
        if (!Number.isFinite(chord.chord)) continue
        const root = chordName(chord.chord, chord.isMinor, key)
        if (!root) continue
        const symbol = `${root}${chord.decorator || ''}`
        const template = chordTemplate(symbol)
        if (!template) continue
        out.push({ symbol, page: pageIndex, line: lineIndex, template })
      }
    })
  })
  return out
}

export function pitchClass(root: string): number | null {
  const match = /^([A-G])(#|b|♯|♭)?/i.exec(root.trim())
  if (!match) return null
  const base = NOTE[match[1].toUpperCase()]
  if (base == null) return null
  const acc = (match[2] || '').replace('♯', '#').replace('♭', 'b')
  const shift = acc === '#' ? 1 : acc === 'b' ? -1 : 0
  return (base + shift + 12) % 12
}

function intervalsFor(body: string): Array<[number, number]> {
  const b = body.trim().toLowerCase()
  if (b.startsWith('maj7') || b.startsWith('major7')) return MAJ7
  if (b.startsWith('m7') || b.startsWith('min7')) return MIN7
  if (b.startsWith('sus2')) return SUS2
  if (b.startsWith('sus4') || b.startsWith('sus')) return SUS4
  if (b.startsWith('dim') || b.startsWith('°')) return DIM
  if (b.startsWith('aug') || b.startsWith('+')) return AUG
  if (b.startsWith('maj')) return MAJ
  if (b.startsWith('min') || b.startsWith('m')) return MIN
  if (b.startsWith('7')) return DOM7
  if (b === '') return MAJ
  return ROOT5
}

/** 12-bin pitch-class template. Unknown qualities fall back to root + fifth. */
export function chordTemplate(symbol: string): number[] | null {
  const trimmed = symbol.trim()
  const match = /^([A-G](?:#|b|♯|♭)?)(.*)$/i.exec(trimmed)
  if (!match) return null
  const root = pitchClass(match[1])
  if (root == null) return null
  const slashAt = match[2].indexOf('/')
  const body = slashAt >= 0 ? match[2].slice(0, slashAt) : match[2]
  const bassName = slashAt >= 0 ? match[2].slice(slashAt + 1) : ''
  const bins = new Array(12).fill(0)
  for (const [interval, weight] of intervalsFor(body)) bins[(root + interval) % 12] += weight
  const bass = bassName ? pitchClass(bassName) : null
  if (bass != null) bins[bass] += 0.65
  return normalize(bins)
}

export function templateChroma(symbol: string): number[] {
  return chordTemplate(symbol) || normalize(new Array(12).fill(0))
}

export function normalize(values: number[]): number[] {
  let sum = 0
  for (const value of values) sum += value * value
  const scale = Math.sqrt(sum)
  if (scale === 0) return values.map(() => 0)
  return values.map((value) => value / scale)
}

export function cosine(left: number[], right: number[]): number {
  let dot = 0
  let leftEnergy = 0
  let rightEnergy = 0
  const n = Math.min(left.length, right.length)
  for (let i = 0; i < n; i++) {
    dot += (left[i] || 0) * (right[i] || 0)
    leftEnergy += (left[i] || 0) ** 2
    rightEnergy += (right[i] || 0) ** 2
  }
  const scale = Math.sqrt(leftEnergy * rightEnergy)
  return scale === 0 ? 0 : dot / scale
}

/** Positive semitones move energy up the pitch-class wheel. */
export function rotateChroma(chroma: number[], semitones: number): number[] {
  const out = new Array(12).fill(0)
  const shift = ((semitones % 12) + 12) % 12
  for (let i = 0; i < 12; i++) out[(i + shift) % 12] = chroma[i] || 0
  return out
}

let catalog: FollowChord[] | null = null
function detectionCatalog(): FollowChord[] {
  if (catalog) return catalog
  catalog = []
  for (const name of NAMES) {
    for (const suffix of QUALITY_SUFFIX) {
      const symbol = `${name}${suffix}`
      const template = chordTemplate(symbol)
      if (template) catalog.push({ symbol, page: 0, line: 0, template })
    }
  }
  return catalog
}

function bestSymbol(chroma: number[], chords: FollowChord[]): { symbol: string, score: number } {
  let symbol = ''
  let score = -1
  for (const chord of chords) {
    const next = cosine(chroma, chord.template)
    if (next > score) { score = next; symbol = chord.symbol }
  }
  return { symbol, score }
}

function argmax(scores: number[]): number {
  let index = 0
  for (let i = 1; i < scores.length; i++) if (scores[i] > scores[index]) index = i
  return index
}

/**
 * Left-to-right score follower. Self-loop, one-chord advance, and a small skip.
 * No backward transitions, so a repeated chorus stays on the later copy.
 */
export class ScoreFollower {
  private readonly chords: FollowChord[]
  private readonly calibrationMs: number
  private readonly turnConfidence: number
  private readonly turnHold: number
  private readonly silenceRms: number
  private readonly opening: FollowChord[]
  private pi: number[]
  private scores = new Array(12).fill(0)
  private voiced = 0
  private originMs: number | null = null
  private locked: number | null = null
  private held = 0
  private lastTurn: number | null = null
  private lastTurnAt = 0

  constructor(chords: FollowChord[], options: ScoreFollowerOptions = {}) {
    this.chords = chords
    this.calibrationMs = options.calibrationMs ?? 8000
    this.turnConfidence = options.turnConfidence ?? 0.55
    this.turnHold = options.turnHold ?? 4
    this.silenceRms = options.silenceRms ?? 0.01
    this.opening = chords.slice(0, Math.min(8, chords.length))
    this.pi = chords.map((_, index) => index === 0 ? 1 : 0)
  }

  push(chroma: number[], rms: number, elapsedMs: number, currentPage: number): FollowSnapshot {
    if (this.lastTurn != null && currentPage >= this.lastTurn) this.lastTurn = null
    if (!(rms >= this.silenceRms) || this.chords.length === 0) {
      return this.view(currentPage, null)
    }

    if (this.originMs == null) this.originMs = elapsedMs
    const heard = normalize(chroma.length === 12 ? chroma : chroma.slice(0, 12).concat(new Array(Math.max(0, 12 - chroma.length)).fill(0)))
    for (let shift = 0; shift < 12; shift++) {
      const aligned = rotateChroma(heard, -shift)
      this.scores[shift] += bestSymbol(aligned, this.opening).score
    }
    this.voiced += 1
    const since = elapsedMs - this.originMs
    if (this.locked == null && this.voiced > 0 && (this.calibrationMs === 0 || (since >= this.calibrationMs && this.voiced >= 5))) {
      this.locked = argmax(this.scores)
    }

    const transposition = this.locked ?? argmax(this.scores)
    const aligned = rotateChroma(heard, -transposition)
    this.advance(aligned)
    const turnTo = this.decide(currentPage, elapsedMs)
    return this.view(currentPage, turnTo, aligned)
  }

  private advance(aligned: number[]): void {
    const n = this.chords.length
    const predicted = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      const mass = this.pi[i]
      if (mass === 0) continue
      if (i >= n - 1) {
        predicted[i] += mass
      } else if (i === n - 2) {
        predicted[i] += mass * 0.64
        predicted[i + 1] += mass * 0.36
      } else {
        predicted[i] += mass * 0.62
        predicted[i + 1] += mass * 0.28
        predicted[i + 2] += mass * 0.10
      }
    }
    let total = 0
    for (let i = 0; i < n; i++) {
      const match = cosine(aligned, this.chords[i].template)
      predicted[i] *= Math.exp(8 * (Math.max(0, match) - 1))
      total += predicted[i]
    }
    if (total <= 0) return
    for (let i = 0; i < n; i++) this.pi[i] = predicted[i] / total
  }

  private decide(currentPage: number, elapsedMs: number): number | null {
    if (this.locked == null) { this.held = 0; return null }
    const estimated = this.chords[argmax(this.pi)]?.page ?? 0
    const confidence = this.pi[argmax(this.pi)] || 0
    const forward = estimated > currentPage && confidence >= this.turnConfidence
    if (!forward) { this.held = 0; return null }
    this.held += 1
    if (this.held < this.turnHold) return null
    const turnTo = currentPage + 1
    if (this.lastTurn === turnTo && elapsedMs < this.lastTurnAt + 1500) return null
    this.lastTurn = turnTo
    this.lastTurnAt = elapsedMs
    this.held = 0
    return turnTo
  }

  private view(currentPage: number, turnTo: number | null, aligned?: number[]): FollowSnapshot {
    const index = this.chords.length ? argmax(this.pi) : 0
    const chord = this.chords[index]
    const transposition = this.locked ?? (this.voiced > 0 ? argmax(this.scores) : 0)
    const detected = aligned ? bestSymbol(aligned, detectionCatalog()).symbol : ''
    return {
      index,
      page: chord?.page ?? currentPage,
      line: chord?.line ?? 0,
      detected,
      matched: chord?.symbol || '',
      confidence: this.chords.length ? (this.pi[index] || 0) : 0,
      transposition,
      transpositionLocked: this.locked != null,
      turnTo,
    }
  }
}
