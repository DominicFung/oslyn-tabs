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
  /** Residual semitones from the 12-way search. Templates are already in the jam key, so this is not the capo. */
  transposition: number
  transpositionLocked: boolean
  /** Next jam page to request, or null when the estimate should not turn. */
  turnTo: number | null
  /** calibrating, follow, or cooldown. */
  state: 'calibrating' | 'follow' | 'cooldown'
}

export type ScoreFollowerOptions = {
  /** Voiced time before the transposition search locks. Tests use 0. */
  calibrationMs?: number
  turnConfidence?: number
  /** Cosine of the winning chord. Solo voice sits under a full chord template. */
  matchFloor?: number
  /** Consecutive voiced frames that must agree before a page turn. */
  turnHold?: number
  /** Quiet time after an automatic turn before another one is allowed. */
  cooldownMs?: number
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

/** Shortest signed distance from `fromKey` up to `toKey`, in -6..6. */
export function semitonesBetween(fromKey: string, toKey: string): number {
  const from = pitchClass(fromKey)
  const to = pitchClass(toKey)
  if (from == null || to == null) return 0
  let delta = (to - from + 12) % 12
  if (delta > 6) delta -= 12
  return delta
}

export function transposeSymbol(symbol: string, semitones: number): string {
  if (!semitones) return symbol
  const match = /^([A-G](?:#|b|♯|♭)?)(.*)$/i.exec(symbol.trim())
  if (!match) return symbol
  const root = shiftNote(match[1], semitones)
  const rest = match[2]
  const slash = rest.indexOf('/')
  if (slash < 0) return root + rest
  return `${root}${rest.slice(0, slash)}/${shiftNote(rest.slice(slash + 1), semitones)}`
}

function shiftNote(name: string, semitones: number): string {
  const pc = pitchClass(name)
  if (pc == null) return name
  return NAMES[(pc + semitones + 120) % 12]
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

function lineOrdinals(chords: FollowChord[]): number[] {
  let ordinal = -1
  let previous = ''
  return chords.map((chord) => {
    const key = `${chord.page}:${chord.line}`
    if (key !== previous) { ordinal += 1; previous = key }
    return ordinal
  })
}

/**
 * Left-to-right score follower. A step stays put unless a later chord explains
 * the frame better, and it cannot see past the next page's opening line.
 * An equal copy of the current chord does not pull the estimate forward.
 */
export class ScoreFollower {
  private readonly chords: FollowChord[]
  private readonly ordinal: number[]
  private readonly calibrationMs: number
  private readonly turnConfidence: number
  private readonly matchFloor: number
  private readonly turnHold: number
  private readonly cooldownMs: number
  private readonly silenceRms: number
  private readonly opening: FollowChord[]
  private pi: number[]
  private scores = new Array(12).fill(0)
  private voiced = 0
  private originMs: number | null = null
  private locked: number | null = null
  private held = 0
  private observe = 0
  private syncedPage: number | null = null
  private leftPage: number | null = null
  private awaiting: number | null = null
  private lastTurnAt: number | null = null
  private matched = new Set<number>()
  private elapsed = 0

  constructor(chords: FollowChord[], options: ScoreFollowerOptions = {}) {
    this.chords = chords
    this.ordinal = lineOrdinals(chords)
    this.calibrationMs = options.calibrationMs ?? 8000
    this.turnConfidence = options.turnConfidence ?? 0.72
    this.matchFloor = options.matchFloor ?? 0.60
    this.turnHold = options.turnHold ?? 4
    this.cooldownMs = options.cooldownMs ?? 7000
    this.silenceRms = options.silenceRms ?? 0.01
    this.opening = chords.slice(0, Math.min(8, chords.length))
    this.pi = chords.map((_, index) => index === 0 ? 1 : 0)
  }

  push(chroma: number[], rms: number, elapsedMs: number, currentPage: number): FollowSnapshot {
    this.notePage(currentPage)
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
    this.elapsed = elapsedMs
    this.advance(aligned)
    const turnTo = this.decide(elapsedMs)
    return this.view(currentPage, turnTo, aligned)
  }

  /** Manual or remote page change. Listening continues from the start of `page`. */
  anchorToPage(page: number) {
    this.awaiting = null
    this.leftPage = null
    this.place(page)
  }

  private notePage(currentPage: number) {
    if (this.syncedPage == null) { this.place(currentPage); return }
    if (currentPage === this.syncedPage) { this.awaiting = null; return }
    if (this.awaiting != null && currentPage === this.leftPage) return
    this.awaiting = null
    this.leftPage = null
    this.place(currentPage)
  }

  private place(page: number) {
    let at = this.chords.findIndex((chord) => chord.page === page)
    if (at < 0) at = this.chords.findIndex((chord) => chord.page > page)
    if (at < 0) at = Math.max(0, this.chords.length - 1)
    this.pi = this.chords.map((_, index) => index === at ? 1 : 0)
    this.syncedPage = page
    this.held = 0
    this.observe = 0
    this.matched = new Set()
  }

  private advance(aligned: number[]): void {
    const n = this.chords.length
    const match = new Array(n).fill(0)
    for (let i = 0; i < n; i++) match[i] = cosine(aligned, this.chords[i].template)
    const predicted = new Array(n).fill(0)
    for (let i = 0; i < n; i++) {
      const mass = this.pi[i]
      if (mass === 0) continue
      const limit = this.reachable(i)
      let bestJ = i
      for (let j = i + 1; j <= limit; j++) {
        if (match[j] > match[i] + 0.03) { bestJ = j; break }
      }
      // Move only toward a chord that explains this frame better. An equal
      // later copy, including the next page's opening, does not count.
      if (bestJ === i + 1) {
        predicted[i] += mass * 0.15
        predicted[i + 1] += mass * 0.85
      } else if (bestJ > i + 1) {
        predicted[i] += mass * 0.1
        predicted[bestJ] += mass * 0.9
      } else if (limit > i) {
        predicted[i] += mass * 0.8
        predicted[i + 1] += mass * 0.2
      } else {
        predicted[i] += mass
      }
    }
    let total = 0
    for (let i = 0; i < n; i++) {
      predicted[i] *= Math.exp(8 * (Math.max(0, match[i]) - 1))
      total += predicted[i]
    }
    if (total <= 0) return
    for (let i = 0; i < n; i++) this.pi[i] = predicted[i] / total
    const index = argmax(this.pi)
    this.observe = match[index] || 0
  }

  /** Furthest chord still on this line or the next one, and not past the next page's first line. */
  private reachable(index: number): number {
    const page = this.syncedPage ?? this.chords[index]?.page ?? 0
    const origin = this.ordinal[index] ?? 0
    let limit = index
    for (let j = index; j < this.chords.length; j++) {
      if ((this.ordinal[j] ?? 0) > origin + 1) break
      const chord = this.chords[j]
      if (chord.page > page + 1) break
      const cooling = this.lastTurnAt != null && this.elapsed - this.lastTurnAt < this.cooldownMs
      if (chord.page === page + 1 && (cooling || !this.onOpeningLine(chord))) break
      limit = j
    }
    return limit
  }

  private onOpeningLine(chord: FollowChord): boolean {
    const first = this.chords.find((item) => item.page === chord.page)
    return !!first && chord.line === first.line
  }

  private decide(elapsedMs: number): number | null {
    const page = this.syncedPage ?? 0
    const index = argmax(this.pi)
    const confidence = this.pi[index] || 0
    const strong = this.observe >= this.matchFloor && confidence >= this.turnConfidence
    // Count current-page hits during calibration too. place() still clears them after a turn.
    if (strong && this.chords[index]?.page === page) this.matched.add(index)
    if (this.locked == null) return null
    const cooled = this.lastTurnAt == null || elapsedMs - this.lastTurnAt >= this.cooldownMs
    const opening = !!(this.chords[index] && this.chords[index].page === page + 1 && this.onOpeningLine(this.chords[index]))
    // Landing on the next page's opening line is the turn signal. Don't also require
    // a prior match on the page we are leaving.
    if (!(strong && cooled && opening)) {
      if (this.held > 0) this.held -= 1
      return null
    }
    this.held += 1
    if (this.held < this.turnHold) return null
    const turnTo = page + 1
    this.leftPage = page
    this.awaiting = turnTo
    this.lastTurnAt = elapsedMs
    this.place(turnTo)
    return turnTo
  }

  private view(currentPage: number, turnTo: number | null, aligned?: number[]): FollowSnapshot {
    const index = this.chords.length ? argmax(this.pi) : 0
    const chord = this.chords[index]
    const transposition = this.locked ?? (this.voiced > 0 ? argmax(this.scores) : 0)
    const detected = aligned ? bestSymbol(aligned, detectionCatalog()).symbol : ''
    const cooling = this.lastTurnAt != null && this.elapsed - this.lastTurnAt < this.cooldownMs
    const state = this.locked == null ? 'calibrating' : cooling ? 'cooldown' : 'follow'
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
      state,
    }
  }
}

export type FollowFrame = {
  t: number
  chroma: number[]
  energy: number
  detected: string
  index: number
  line: number
  page: number
  matched: string
  confidence: number
  transposition: number
  transpositionLocked: boolean
  state: string
}

export type FollowEstimated = {
  index: number
  line: number
  page: number
  matched: string
  confidence: number
}

export type FollowMark = {
  t: number
  type: 'auto-turn' | 'page-change' | 'should-turn' | 'manual-correction'
  page?: number
  /** prev goes back a page, next goes forward. Space marks stay should-turn. */
  direction?: 'prev' | 'next'
  source?: 'key' | 'button'
  pageBefore?: number
  pageAfter?: number
  estimated?: FollowEstimated
}

export type FollowChartChord = { symbol: string, page: number, line: number }
export type FollowPageLayout = { page: number, lines: string[] }

/** One debug recording. Replay uses `frames` and does not decode audio. */
export type FollowSessionFile = {
  version: 1
  songId: string
  title: string
  /** Written chart key. */
  chartKey?: string
  /** Sounding jam key. Templates are built in this key. Capo is not applied. */
  key: string
  capo: number | null
  userAgent: string
  appVersion: string
  commit: string
  recordedAt: string
  options?: ScoreFollowerOptions
  chords: FollowChartChord[]
  pages: FollowPageLayout[]
  frames: FollowFrame[]
  events: FollowMark[]
}

export type TurnReport = {
  expectedT: number
  predictedT: number | null
  /** Predicted minus expected, in seconds. Negative means the follower was early. */
  deltaSec: number | null
  missed: boolean
}

export type ReplayReport = {
  turns: TurnReport[]
  falseTurns: number[]
  missed: number
  score: number
}

const MATCH_WINDOW_MS = 5000
/** A manual previous-page tap this soon after an automatic turn rejects that turn. */
const EARLY_REJECT_MS = 8000
/** Space, then the same next a moment later, is one expected turn. */
const DEDUPE_MS = 4000

function expectedMarks(events: FollowMark[]): FollowMark[] {
  const raw = events.filter((event) =>
    event.type === 'should-turn' || (event.type === 'manual-correction' && event.direction === 'next')
  )
  const kept: FollowMark[] = []
  for (const event of raw) {
    const prev = kept[kept.length - 1]
    const duplicate = prev
      && prev.type === 'should-turn'
      && event.type === 'manual-correction'
      && event.direction === 'next'
      && event.t >= prev.t
      && event.t - prev.t <= DEDUPE_MS
      && (event.pageBefore == null || prev.page == null || event.pageBefore === prev.page)
    if (duplicate) continue
    kept.push(event)
  }
  return kept
}

export function scoreSession(session: FollowSessionFile): ReplayReport {
  const chords: FollowChord[] = []
  for (const chord of session.chords) {
    const template = chordTemplate(chord.symbol)
    if (!template) continue
    chords.push({ ...chord, template })
  }
  const follower = new ScoreFollower(chords, session.options || {})
  const anchors = session.events.filter((event) =>
    (event.type === 'manual-correction' || event.type === 'page-change')
    && (event.pageAfter != null || event.page != null)
  )
  let page = 0
  let anchorAt = 0
  const predicted: number[] = []
  for (const frame of session.frames) {
    while (anchorAt < anchors.length && anchors[anchorAt].t < frame.t) {
      const anchor = anchors[anchorAt]
      page = anchor.pageAfter ?? anchor.page ?? page
      anchorAt += 1
    }
    const snap = follower.push(frame.chroma, frame.energy, frame.t, page)
    if (snap.turnTo != null) {
      predicted.push(frame.t)
      page = snap.turnTo
    }
  }
  const expected = expectedMarks(session.events).map((event) => event.t)
  const used = new Set<number>()
  const turns: TurnReport[] = expected.map((expectedT) => {
    let best = -1
    let bestGap = Infinity
    predicted.forEach((time, index) => {
      if (used.has(index)) return
      const gap = Math.abs(time - expectedT)
      if (gap < bestGap) { bestGap = gap; best = index }
    })
    if (best < 0 || bestGap > MATCH_WINDOW_MS) {
      return { expectedT, predictedT: null, deltaSec: null, missed: true }
    }
    used.add(best)
    return { expectedT, predictedT: predicted[best], deltaSec: (predicted[best] - expectedT) / 1000, missed: false }
  })
  const rejected = new Set<number>()
  for (const mark of session.events) {
    if (mark.type !== 'manual-correction' || mark.direction !== 'prev') continue
    const auto = session.events.filter((event) => event.type === 'auto-turn' && event.t <= mark.t).pop()
    if (!auto || mark.t - auto.t > EARLY_REJECT_MS) continue
    let best = -1
    let bestGap = Infinity
    predicted.forEach((time, index) => {
      const gap = Math.abs(time - auto.t)
      if (gap < bestGap) { bestGap = gap; best = index }
    })
    if (best >= 0 && bestGap <= EARLY_REJECT_MS) rejected.add(best)
  }
  rejected.forEach((index) => used.delete(index))
  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i]
    if (turn.predictedT == null) continue
    const index = predicted.indexOf(turn.predictedT)
    if (index >= 0 && rejected.has(index)) {
      turns[i] = { expectedT: turn.expectedT, predictedT: null, deltaSec: null, missed: true }
    }
  }
  const falseTurns = predicted.filter((_, index) => !used.has(index) || rejected.has(index))
  const missed = turns.filter((turn) => turn.missed).length
  let score = 1
  for (const turn of turns) {
    if (turn.missed) score -= 0.4
    else score -= Math.min(0.3, Math.abs(turn.deltaSec || 0) / 10)
  }
  score -= Math.min(0.5, falseTurns.length * 0.25)
  if (expected.length === 0 && predicted.length === 0 && falseTurns.length === 0) score = 1
  return { turns, falseTurns, missed, score: Math.max(0, Math.min(1, score)) }
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i]
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}

/** Uncompressed zip. Bytes are copied with set(); nothing is spread. */
export function zipStore(files: { name: string, data: Uint8Array }[]): Uint8Array {
  const encoded = files.map((file) => ({
    name: new TextEncoder().encode(file.name),
    data: file.data,
    crc: crc32(file.data),
  }))
  let total = 22
  for (let i = 0; i < encoded.length; i++) {
    total += 30 + encoded[i].name.length + encoded[i].data.length + 46 + encoded[i].name.length
  }
  const out = new Uint8Array(total)
  const view = new DataView(out.buffer)
  let offset = 0
  const localAt: number[] = []
  for (let i = 0; i < encoded.length; i++) {
    const file = encoded[i]
    localAt.push(offset)
    view.setUint32(offset, 0x04034b50, true); offset += 4
    view.setUint16(offset, 20, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint32(offset, file.crc, true); offset += 4
    view.setUint32(offset, file.data.length, true); offset += 4
    view.setUint32(offset, file.data.length, true); offset += 4
    view.setUint16(offset, file.name.length, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    out.set(file.name, offset); offset += file.name.length
    out.set(file.data, offset); offset += file.data.length
  }
  const centralStart = offset
  for (let i = 0; i < encoded.length; i++) {
    const file = encoded[i]
    view.setUint32(offset, 0x02014b50, true); offset += 4
    view.setUint16(offset, 20, true); offset += 2
    view.setUint16(offset, 20, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint32(offset, file.crc, true); offset += 4
    view.setUint32(offset, file.data.length, true); offset += 4
    view.setUint32(offset, file.data.length, true); offset += 4
    view.setUint16(offset, file.name.length, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint16(offset, 0, true); offset += 2
    view.setUint32(offset, 0, true); offset += 4
    view.setUint32(offset, localAt[i], true); offset += 4
    out.set(file.name, offset); offset += file.name.length
  }
  const centralSize = offset - centralStart
  view.setUint32(offset, 0x06054b50, true); offset += 4
  view.setUint16(offset, 0, true); offset += 2
  view.setUint16(offset, 0, true); offset += 2
  view.setUint16(offset, encoded.length, true); offset += 2
  view.setUint16(offset, encoded.length, true); offset += 2
  view.setUint32(offset, centralSize, true); offset += 4
  view.setUint32(offset, centralStart, true); offset += 4
  view.setUint16(offset, 0, true); offset += 2
  return out
}

export function sessionZip(session: FollowSessionFile, audio: Uint8Array | null): Uint8Array {
  const files = [{ name: 'session.json', data: new TextEncoder().encode(JSON.stringify(session)) }]
  if (audio && audio.length) files.push({ name: 'audio.webm', data: audio })
  return zipStore(files)
}

function round3(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 1000) / 1000
}

/** Chroma and confidence are what make session.json large. Three decimals is enough to replay. */
export function compactSession(session: FollowSessionFile): FollowSessionFile {
  return {
    ...session,
    frames: session.frames.map((frame) => ({
      ...frame,
      chroma: frame.chroma.map(round3),
      confidence: round3(frame.confidence),
    })),
    events: session.events.map((event) => event.estimated
      ? { ...event, estimated: { ...event.estimated, confidence: round3(event.estimated.confidence) } }
      : event),
  }
}

export type FollowChunkPart = {
  chunk: number
  start: number
  end: number
  frames: FollowFrame[]
  events: FollowMark[]
}

export type FollowManifestChunk = {
  part: number
  start: number
  end: number
  audio?: string
  session: string
}

/** Header for one take. `chunks` grows as parts are uploaded. Audio parts are separate files. */
export type FollowManifest = {
  version: 1
  songId: string
  sessionId: string
  title: string
  chartKey?: string
  key: string
  capo: number | null
  userAgent: string
  appVersion: string
  commit: string
  recordedAt: string
  chords: FollowChartChord[]
  pages: FollowPageLayout[]
  chunks: FollowManifestChunk[]
  finished: boolean
}

export function partFileNames(part: number): { audio: string, json: string } {
  const label = String(Math.max(0, Math.floor(part))).padStart(4, '0')
  return { audio: `part-${label}.webm`, json: `part-${label}.json` }
}

export function compactPart(part: FollowChunkPart): FollowChunkPart {
  return {
    ...part,
    frames: part.frames.map((frame) => ({
      ...frame,
      chroma: frame.chroma.map(round3),
      confidence: round3(frame.confidence),
    })),
    events: part.events.map((event) => event.estimated
      ? { ...event, estimated: { ...event.estimated, confidence: round3(event.estimated.confidence) } }
      : event),
  }
}

/** Parts are ordered by chunk index. A repeated index keeps the later copy. */
export function stitchParts(manifest: FollowManifest, parts: FollowChunkPart[]): FollowSessionFile {
  const byChunk = new Map<number, FollowChunkPart>()
  for (const part of parts) byChunk.set(part.chunk, part)
  const ordered = Array.from(byChunk.values()).sort((a, b) => a.chunk - b.chunk)
  return {
    version: 1,
    songId: manifest.songId,
    title: manifest.title,
    chartKey: manifest.chartKey,
    key: manifest.key,
    capo: manifest.capo,
    userAgent: manifest.userAgent,
    appVersion: manifest.appVersion,
    commit: manifest.commit,
    recordedAt: manifest.recordedAt,
    chords: manifest.chords,
    pages: manifest.pages,
    frames: ordered.flatMap((part) => part.frames),
    events: ordered.flatMap((part) => part.events),
  }
}

export function chunkZip(manifest: FollowManifest, part: FollowChunkPart, audio: Uint8Array | null): Uint8Array {
  const names = partFileNames(part.chunk)
  const files = [
    { name: 'manifest.json', data: new TextEncoder().encode(JSON.stringify(manifest)) },
    { name: names.json, data: new TextEncoder().encode(JSON.stringify(part)) },
  ]
  if (audio && audio.length) files.push({ name: names.audio, data: audio })
  return zipStore(files)
}
