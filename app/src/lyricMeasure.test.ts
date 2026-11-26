import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { acceptChordLineWidth, acceptMeasuredWidth, chordOffsets, commitCount } from './lyricMeasure.ts'

describe('lyric measurement', () => {
  it('ignores a repeated or empty layout width', () => {
    assert.equal(acceptMeasuredWidth(180, 180.4), 180)
    assert.equal(acceptMeasuredWidth(180, 0), 180)
    assert.equal(acceptMeasuredWidth(180, Number.NaN), 180)
    assert.equal(acceptMeasuredWidth(0, 180.2), 180)
  })

  it('returns the same object when onTextLayout fires again with the same width', () => {
    const first = { line: 0, chord: 0 }
    const settled = acceptChordLineWidth(first, 'line', 210.2)
    const again = acceptChordLineWidth(settled, 'line', 210.4)
    assert.equal(again, settled)
    assert.equal(acceptChordLineWidth(settled, 'chord', 40.2).chord, 40)
  })

  it('keeps a trailing chord on a chord-only line and past the lyric', () => {
    const intro = chordOffsets(' '.repeat(19), [0, 2, 5, 10], 8)
    assert.equal(intro.length, 4)
    assert.deepEqual(intro, [0, 16, 40, 80])
    const trailing = chordOffsets('Oh how I love', [0, 3, 20], 8)
    assert.equal(trailing[2], 20 * 8)
    assert.ok(trailing[2] > 'Oh how I love'.length * 8)
  })

  it('does not keep committing when layout events repeat', () => {
    const events: Array<['line' | 'chord', number]> = []
    for (let i = 0; i < 30; i++) {
      events.push(['line', 180.2])
      events.push(['chord', 96.6])
    }
    assert.equal(commitCount(events), 2)
  })
})
