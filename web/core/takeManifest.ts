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
