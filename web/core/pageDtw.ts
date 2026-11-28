// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import { rotateChroma, type FollowSessionFile } from './follow.ts'
import type { VoteSignal } from './followVote'

const TAU_S = 30
const SILENCE = 0.01
const TAIL = 30
const START_SLACK = 12
const LEAD_MS = 1000
const PERSIST = 3
const SHIFT_FRAMES = 16

export type ChromaFrame = { t: number, chroma: number[], energy: number }

export type PageSegment = { page: number, start: number, tap: number }

/** One earlier take, cut into pages at the player's forward taps. */
export type TakeReference = {
  id: string
  times: number[]
  features: number[][]
  segments: PageSegment[]
}

function dot(a: number[], b: number[]): number {
  let sum = 0
  for (let i = 0; i < 12; i++) sum += (a[i] || 0) * (b[i] || 0)
  return sum
}

function norm12(values: number[]): number[] {
  let sum = 0
  for (let i = 0; i < 12; i++) sum += values[i] * values[i]
  const out = new Array(12).fill(0)
  if (sum < 1e-12) return out
  const scale = 1 / Math.sqrt(sum)
  for (let i = 0; i < 12; i++) out[i] = values[i] * scale
  return out
}

/** Same running-mean chroma features for a whole take or one live frame at a time. */
export class FeatureStream {
  private mean = new Array(12).fill(0)
  private ready = false
  private lastT: number | null = null

  push(frame: ChromaFrame): number[] {
    const chroma = frame.chroma.length >= 12 ? frame.chroma : frame.chroma.concat(new Array(12).fill(0)).slice(0, 12)
    let total = 0
    for (let i = 0; i < 12; i++) total += chroma[i] || 0
    const scale = total > 1e-9 ? 1 / total : 0
    const shaped = new Array(12).fill(0)
    for (let i = 0; i < 12; i++) shaped[i] = Math.sqrt(Math.max(0, (chroma[i] || 0) * scale))
    const dt = this.lastT == null ? 0.1 : Math.max(0.02, (frame.t - this.lastT) / 1000)
    this.lastT = frame.t
    const blend = dt / TAU_S
    if (frame.energy >= SILENCE) {
      if (!this.ready) {
        for (let i = 0; i < 12; i++) this.mean[i] = shaped[i]
        this.ready = true
      } else {
        for (let i = 0; i < 12; i++) this.mean[i] = (1 - blend) * this.mean[i] + blend * shaped[i]
      }
    }
    const delta = new Array(12).fill(0)
    for (let i = 0; i < 12; i++) delta[i] = shaped[i] - this.mean[i]
    return norm12(delta)
  }
}

export function featuresFromFrames(frames: ChromaFrame[]): { times: number[], features: number[][] } {
  const stream = new FeatureStream()
  const times: number[] = []
  const features: number[][] = []
  for (let i = 0; i < frames.length; i++) {
    times.push(frames[i].t)
    features.push(stream.push(frames[i]))
  }
  return { times, features }
}

function forwardTaps(session: FollowSessionFile): { t: number, from: number, to: number }[] {
  const events = session.events.slice().sort((a, b) => a.t - b.t)
  const taps: { t: number, from: number, to: number }[] = []
  for (let i = 0; i < events.length; i++) {
    const event = events[i]
    if (event.type !== 'manual-correction' || event.direction !== 'next') continue
    let undone = false
    for (let j = i + 1; j < events.length; j++) {
      const other = events[j]
      if (other.t - event.t > 3000) break
      if (other.type === 'manual-correction' && other.direction === 'prev') { undone = true; break }
    }
    if (undone) continue
    const from = event.pageBefore ?? 0
    const to = event.pageAfter ?? from + 1
    if (to !== from + 1) continue
    taps.push({ t: event.t, from, to })
  }
  return taps
}

function indexAt(times: number[], t: number): number {
  let lo = 0
  let hi = times.length
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (times[mid] < t) lo = mid + 1
    else hi = mid
  }
  return lo
}

/** Null when the take has fewer than two forward taps. */
export function referenceFromSession(session: FollowSessionFile, id?: string): TakeReference | null {
  const taps = forwardTaps(session)
  if (taps.length < 2) return null
  const built = featuresFromFrames(session.frames.map((frame) => ({ t: frame.t, chroma: frame.chroma, energy: frame.energy })))
  const byPage = new Map<number, PageSegment>()
  let page = taps[0].from
  let enter = 0
  for (let i = 0; i < taps.length; i++) {
    const tap = taps[i]
    if (tap.from === page && tap.to === page + 1 && tap.t - (enter === 0 ? built.times[0] || 0 : enter) >= 1500) {
      const start = indexAt(built.times, enter)
      const end = indexAt(built.times, tap.t)
      if (end > start) {
        const segment = { page, start, tap: end }
        const prev = byPage.get(page)
        const prevLen = prev ? prev.tap - prev.start : 0
        if (!prev || end - start > prevLen) byPage.set(page, segment)
      }
    }
    page = tap.to
    enter = tap.t
  }
  const segments: PageSegment[] = []
  byPage.forEach((segment) => segments.push(segment))
  segments.sort((a, b) => a.page - b.page)
  if (segments.length === 0) return null
  return { id: id || session.songId, times: built.times, features: built.features, segments }
}

function cosineDist(a: number[], b: number[]): number {
  return 1 - dot(a, b)
}

/** Closed DTW cost, normalised by the path length. Used to pick a chroma rotation. */
export function dtwCost(live: number[][], ref: number[][]): number {
  const n = live.length
  const m = ref.length
  if (n === 0 || m === 0) return 1
  let prev = new Array(m + 1).fill(1e9)
  prev[0] = 0
  for (let i = 1; i <= n; i++) {
    const row = new Array(m + 1).fill(1e9)
    for (let j = 1; j <= m; j++) {
      const dist = cosineDist(live[i - 1], ref[j - 1])
      const diag = prev[j - 1]
      const up = prev[j]
      const left = row[j - 1]
      row[j] = dist + Math.min(diag, up, left)
    }
    prev = row
  }
  return prev[m] / (n + m)
}

/**
 * Rotation of `ref` that best matches `live`. 0 means the sequences already
 * share a key. The same roll as `rotateChroma`.
 */
export function bestShift(live: number[][], ref: number[][]): number {
  const n = Math.min(live.length, 48)
  const m = Math.min(ref.length, 48)
  const a = live.slice(0, n)
  const b = ref.slice(0, m)
  let best = 0
  let bestCost = Infinity
  for (let shift = 0; shift < 12; shift++) {
    const rotated: number[][] = []
    for (let i = 0; i < b.length; i++) rotated.push(rotateChroma(b[i], shift))
    const cost = dtwCost(a, rotated)
    if (cost < bestCost) { bestCost = cost; best = shift }
  }
  return best
}

class PageCursor {
  private prev: number[] | null = null
  private steps = 0
  private pos = 0
  readonly ok: boolean
  private ref: number[][]
  private times: number[]
  private tapTime = 0

  constructor(take: TakeReference, page: number, shift: number) {
    const segment = take.segments.filter((item) => item.page === page)[0]
    this.ok = !!segment
    this.ref = []
    this.times = []
    if (!segment) return
    const end = Math.min(take.features.length, segment.tap + TAIL)
    for (let i = segment.start; i < end; i++) {
      this.ref.push(shift ? rotateChroma(take.features[i], shift) : take.features[i])
      this.times.push(take.times[i])
    }
    const tapIndex = Math.min(Math.max(segment.tap, segment.start), take.times.length - 1)
    this.tapTime = take.times[tapIndex] ?? 0
  }

  push(frame: number[]) {
    if (!this.ok || this.ref.length === 0) return
    const cost = new Array(this.ref.length)
    let energy = 0
    for (let i = 0; i < 12; i++) energy += frame[i] * frame[i]
    for (let j = 0; j < this.ref.length; j++) {
      let refEnergy = 0
      for (let i = 0; i < 12; i++) refEnergy += this.ref[j][i] * this.ref[j][i]
      cost[j] = 0.5 * (refEnergy + energy - 2 * dot(this.ref[j], frame))
    }
    if (!this.prev) {
      const row = new Array(cost.length).fill(1e9)
      const slack = Math.min(START_SLACK, cost.length)
      for (let j = 0; j < slack; j++) row[j] = cost[j]
      this.prev = row
      this.steps = 1
    } else {
      const row = new Array(cost.length)
      for (let j = 0; j < cost.length; j++) {
        const stay = this.prev[j]
        const step1 = j > 0 ? this.prev[j - 1] : 1e9
        const step2 = j > 1 ? this.prev[j - 2] : 1e9
        row[j] = cost[j] + Math.min(stay, step1, step2)
      }
      this.prev = row
      this.steps += 1
    }
    let best = 0
    let bestNorm = Infinity
    for (let j = 0; j < this.prev.length; j++) {
      const value = this.prev[j] / (this.steps + j)
      if (value < bestNorm) { bestNorm = value; best = j }
    }
    this.pos = best
  }

  /** True once the alignment is about a second before the reference tap, or past it. */
  crossed(leadMs = LEAD_MS): boolean {
    if (!this.ok || this.times.length === 0) return false
    const aligned = this.times[Math.min(this.pos, this.times.length - 1)]
    return this.steps >= 4 && aligned >= this.tapTime - leadMs
  }
}

/**
 * Online alignment of the live page against every reference take.
 * Fewer than two references, or a page none of them contain, abstains.
 */
export class TakeBank {
  private shift: number | null = null
  private page = -1
  private opening: number[][] = []
  private cursors: PageCursor[] = []
  private hold = 0
  private refs: TakeReference[]
  private leadMs: number
  readonly stream = new FeatureStream()

  constructor(refs: TakeReference[], leadMs = LEAD_MS) {
    this.refs = refs
    this.leadMs = leadMs
  }

  get ready(): boolean { return this.refs.length >= 2 }

  private usable(page: number): TakeReference[] {
    const out: TakeReference[] = []
    for (let i = 0; i < this.refs.length; i++) {
      if (this.refs[i].segments.some((segment) => segment.page === page)) out.push(this.refs[i])
    }
    return out
  }

  push(frame: ChromaFrame, page: number): VoteSignal {
    const feature = this.stream.push(frame)
    if (!this.ready) return 'abstain'
    if (page !== this.page) {
      this.page = page
      this.hold = 0
      this.cursors = []
      if (this.shift == null) this.opening = []
    }
    const have = this.usable(page)
    if (have.length === 0) return 'abstain'
    let justLocked = false
    if (this.shift == null) {
      this.opening.push(feature)
      if (this.opening.length < SHIFT_FRAMES) return 'wait'
      let best = 0
      let bestCost = Infinity
      for (let shift = 0; shift < 12; shift++) {
        let cost = 0
        for (let i = 0; i < have.length; i++) {
          const segment = have[i].segments.filter((item) => item.page === page)[0]
          const ref: number[][] = []
          const end = Math.min(have[i].features.length, segment.tap, segment.start + 48)
          for (let j = segment.start; j < end; j++) ref.push(rotateChroma(have[i].features[j], shift))
          if (ref.length) cost += dtwCost(this.opening.slice(0, 48), ref)
        }
        if (cost < bestCost) { bestCost = cost; best = shift }
      }
      this.shift = best
      justLocked = true
    }
    if (this.cursors.length === 0) {
      for (let i = 0; i < have.length; i++) this.cursors.push(new PageCursor(have[i], page, this.shift || 0))
      if (justLocked) {
        for (let i = 0; i < this.opening.length - 1; i++) {
          for (let j = 0; j < this.cursors.length; j++) this.cursors[j].push(this.opening[i])
        }
      }
    }
    let crossed = 0
    let usable = 0
    for (let i = 0; i < this.cursors.length; i++) {
      if (!this.cursors[i].ok) continue
      this.cursors[i].push(feature)
      usable += 1
      if (this.cursors[i].crossed(this.leadMs)) crossed += 1
    }
    if (usable === 0) return 'abstain'
    const need = Math.max(1, Math.ceil(usable * 0.5 - 1e-9))
    if (crossed >= need) this.hold += 1
    else this.hold = 0
    return this.hold >= PERSIST ? 'turn' : 'wait'
  }
}
