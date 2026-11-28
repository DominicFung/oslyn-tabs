import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { captureChart } from './captureChart.ts'
import { estimateClockOffset, formatElapsed, pageChangeMark, recordingManifest, remoteTurnMark } from './takeManifest.ts'

const meta = {
  songId: '5618be0c-13c8-4ed3-8adf-bcba7ee88429',
  title: 'Build My Life',
  chartKey: 'G',
  key: 'E',
  capo: 2,
  mode: 'train' as const,
}

describe('train me capture', () => {
  it('marks a take as train and keeps the page layout', () => {
    const sheet = ['[Verse]', 'D    A', 'Light of the world', '', 'G    D', 'Sing hallelujah'].join('\n')
    const chart = captureChart(sheet, 'D', 'D')
    assert.ok(chart.pages.length >= 1)
    assert.ok(chart.chords.length >= 1)
    const manifest = recordingManifest({
      meta,
      sessionId: '2aaed060-5512-42cf-bb74-5be8a2db073e',
      recordedAt: '2026-11-28T00:00:00.000Z',
      chords: chart.chords.map(({ symbol, page, line }) => ({ symbol, page, line })),
      pages: chart.pages,
      chunks: [],
      finished: false,
    })
    assert.equal(manifest.mode, 'train')
    assert.equal(manifest.pages.length, chart.pages.length)
    assert.equal(manifest.songId, meta.songId)
  })

  it('stores the jam, the participant, and the server clock offset on a train manifest', () => {
    const manifest = recordingManifest({
      meta: { ...meta, jamId: 'ad387cad-4c88-483e-a70a-fae729dc346b', userId: 'user-1', clockOffsetMs: 42 },
      sessionId: '2aaed060-5512-42cf-bb74-5be8a2db073e',
      recordedAt: '2026-11-28T00:00:00.000Z',
      chords: [],
      pages: [],
      chunks: [],
      finished: true,
      userAgent: 'TestBrowser',
    })
    assert.equal(manifest.jamId, 'ad387cad-4c88-483e-a70a-fae729dc346b')
    assert.equal(manifest.userId, 'user-1')
    assert.equal(manifest.userAgent, 'TestBrowser')
    assert.equal(manifest.clockOffsetMs, 42)
    assert.equal(estimateClockOffset(1_000_120, 1_000_000, 1_000_080), 80)
  })

  it('logs a remote page turn for everyone else and drops the tapper echo', () => {
    const remote = remoteTurnMark({
      page: 2, seen: 1, t: 5000, receivedAt: 1_700_000_000_000, recent: [],
    })
    assert.equal(remote?.source, 'remote')
    assert.equal(remote?.direction, 'next')
    assert.equal(remote?.pageBefore, 1)
    assert.equal(remote?.pageAfter, 2)
    assert.equal(remote?.receivedAt, 1_700_000_000_000)
    assert.equal(remote?.sentAt, undefined)
    const echo = remoteTurnMark({
      page: 2,
      seen: 1,
      t: 5300,
      receivedAt: 1_700_000_000_300,
      recent: [{ t: 5000, type: 'manual-correction', source: 'button', pageBefore: 1, pageAfter: 2 }],
    })
    assert.equal(echo, null)
  })

  it('logs a manual tap once and never invents an automatic turn', () => {
    const armed = pageChangeMark({ page: 1, seen: 0, pendingManual: 1, pendingAuto: null, t: 1200 })
    assert.equal(armed.mark, null)
    assert.equal(armed.seen, 1)
    const plain = pageChangeMark({ page: 1, seen: 0, pendingManual: null, pendingAuto: null, t: 1200 })
    assert.equal(plain.mark?.type, 'page-change')
    const auto = pageChangeMark({ page: 1, seen: 0, pendingManual: null, pendingAuto: 1, t: 1200 })
    assert.equal(auto.mark?.type, 'auto-turn')
  })

  it('formats the recording clock', () => {
    assert.equal(formatElapsed(0), '0:00')
    assert.equal(formatElapsed(12_400), '0:12')
    assert.equal(formatElapsed(75_000), '1:15')
  })
})
