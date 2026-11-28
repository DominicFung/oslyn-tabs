// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import type { FollowChartChord, FollowManifest, FollowManifestChunk, FollowMark, FollowPageLayout } from './follow.ts'

export type TakeMode = 'follow' | 'train'

export type TakeMeta = {
  songId: string
  title: string
  chartKey: string
  key: string
  capo: number
  mode: TakeMode
  jamId?: string
  userId?: string
  clockOffsetMs?: number
}

/** serverNow minus the midpoint of the local samples around the request. */
export function estimateClockOffset(serverNow: number, localBefore: number, localAfter: number): number {
  return Math.round(serverNow - (localBefore + localAfter) / 2)
}

export const REMOTE_ECHO_MS = 3000

/**
 * A page change that arrived on the jam channel. The tapper's own recorder
 * already stored that turn, so the echo within a few seconds is dropped.
 */
export function remoteTurnMark(input: {
  page: number
  seen: number
  t: number
  receivedAt: number
  sentAt?: number
  userId?: string
  recent: FollowMark[]
}): FollowMark | null {
  if (input.page === input.seen) return null
  const echo = input.recent.some((mark) =>
    mark.source !== 'remote'
    && mark.pageAfter === input.page
    && input.t - mark.t >= 0
    && input.t - mark.t <= REMOTE_ECHO_MS
  )
  if (echo) return null
  return {
    t: input.t,
    type: 'manual-correction',
    direction: input.page > input.seen ? 'next' : 'prev',
    source: 'remote',
    pageBefore: input.seen,
    pageAfter: input.page,
    page: input.page,
    receivedAt: input.receivedAt,
    sentAt: input.sentAt,
    userId: input.userId,
  }
}

export function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  const padded = seconds < 10 ? `0${seconds}` : String(seconds)
  return `${minutes}:${padded}`
}

export function recordingManifest(input: {
  meta: TakeMeta
  sessionId: string
  recordedAt: string
  chords: FollowChartChord[]
  pages: FollowPageLayout[]
  chunks: FollowManifestChunk[]
  finished: boolean
  userAgent?: string
  commit?: string
}): FollowManifest {
  return {
    version: 1,
    songId: input.meta.songId || 'unknown',
    sessionId: input.sessionId,
    title: input.meta.title,
    chartKey: input.meta.chartKey,
    key: input.meta.key,
    capo: Number.isFinite(input.meta.capo) ? input.meta.capo : null,
    userAgent: input.userAgent || '',
    appVersion: '0.1.0',
    commit: input.commit || 'unknown',
    recordedAt: input.recordedAt,
    chords: input.chords,
    pages: input.pages,
    chunks: input.chunks,
    finished: input.finished,
    mode: input.meta.mode,
    jamId: input.meta.jamId || undefined,
    userId: input.meta.userId || undefined,
    clockOffsetMs: input.meta.clockOffsetMs,
  }
}

/**
 * What to log when the shown page changes. A manual tap was already stored.
 * An automatic turn is logged only when one was armed. Train never arms one.
 */
export function pageChangeMark(input: {
  page: number
  seen: number
  pendingManual: number | null
  pendingAuto: number | null
  t: number
}): { mark: FollowMark | null, pendingManual: number | null, pendingAuto: number | null, seen: number } {
  if (input.page === input.seen) {
    return { mark: null, pendingManual: input.pendingManual, pendingAuto: input.pendingAuto, seen: input.seen }
  }
  if (input.pendingManual === input.page) {
    return { mark: null, pendingManual: null, pendingAuto: null, seen: input.page }
  }
  if (input.pendingAuto === input.page) {
    return {
      mark: { t: input.t, type: 'auto-turn', page: input.page, pageBefore: input.seen, pageAfter: input.page },
      pendingManual: input.pendingManual,
      pendingAuto: null,
      seen: input.page,
    }
  }
  return {
    mark: { t: input.t, type: 'page-change', page: input.page, pageBefore: input.seen, pageAfter: input.page },
    pendingManual: input.pendingManual,
    pendingAuto: input.pendingAuto,
    seen: input.page,
  }
}
