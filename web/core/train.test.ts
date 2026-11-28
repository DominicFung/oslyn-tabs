import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { captureChart } from './captureChart.ts'
import { formatElapsed, pageChangeMark, recordingManifest } from './takeManifest.ts'

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
