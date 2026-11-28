import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { rotateChroma } from './follow.ts'
import { bestShift, referenceFromSession, type ChromaFrame } from './pageDtw.ts'
import type { FollowSessionFile } from './follow.ts'

function pattern(n: number): number[][] {
  const frames: number[][] = []
  for (let i = 0; i < n; i++) {
    const frame = new Array(12).fill(0)
    frame[i % 12] = 1
    frame[(i * 3) % 12] = 0.4
    frames.push(frame)
  }
  return frames
}

describe('page-local DTW', () => {
  it('finds the chroma rotation on a transposed sequence', () => {
    const ref = pattern(24)
    const live = ref.map((frame) => rotateChroma(frame, 3))
    assert.equal(bestShift(live, ref), 3)
    assert.equal(bestShift(ref, ref), 0)
  })

  it('keeps a take only when it has two forward taps', () => {
    const frames: ChromaFrame[] = []
    for (let i = 0; i < 40; i++) frames.push({ t: i * 100, chroma: pattern(1)[0], energy: 0.2 })
    const session = {
      version: 1,
      songId: 'song',
      title: 'T',
      key: 'C',
      capo: 0,
      userAgent: '',
      appVersion: '',
      commit: '',
      recordedAt: '2026-11-28T00:00:00.000Z',
      chords: [],
      pages: [],
      frames,
      events: [
        { t: 1500, type: 'manual-correction', direction: 'next', pageBefore: 0, pageAfter: 1 },
      ],
    } as FollowSessionFile
    assert.equal(referenceFromSession(session), null)
    session.events.push({ t: 3000, type: 'manual-correction', direction: 'next', pageBefore: 1, pageAfter: 2 })
    const ref = referenceFromSession(session, 'take')
    assert.ok(ref)
    assert.equal(ref?.id, 'take')
    assert.ok((ref?.segments.length || 0) >= 1)
    const early = referenceFromSession({
      ...session,
      events: [
        { t: 1000, type: 'manual-correction', direction: 'next', pageBefore: 0, pageAfter: 1 },
        { t: 1200, type: 'manual-correction', direction: 'prev', pageBefore: 1, pageAfter: 0 },
        { t: 3000, type: 'manual-correction', direction: 'next', pageBefore: 0, pageAfter: 1 },
      ],
    })
    assert.equal(early, null)
  })
})
