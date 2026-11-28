import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LyricTracker, wordsFromHop } from './lyricMatch.ts'

const pages = [
  { page: 0, lines: ['amazing grace how sweet', 'the sound that saved'] },
  { page: 1, lines: ['the sound that saved', 'a wretch like me'] },
]

describe('lyric last line', () => {
  it('abstains on a page with no lyrics', () => {
    const tracker = new LyricTracker([{ page: 0, lines: ['', 'D'] }])
    tracker.hear(0, 0, [])
    assert.equal(tracker.signal(0, 5000, 0), 'abstain')
  })

  it('waits until the page has been open long enough', () => {
    const tracker = new LyricTracker(pages, 3000)
    const words = wordsFromHop('the sound that saved', 2000, 1000)
    tracker.hear(0, 0, words)
    assert.equal(tracker.signal(0, 2000, 0), 'wait')
    assert.equal(tracker.signal(0, 3200, 0), 'turn')
  })

  it('ignores a repeated chorus line heard before this page opened', () => {
    const tracker = new LyricTracker(pages, 1000)
    tracker.hear(1, 10000, wordsFromHop('the sound that saved', 9000, 1000))
    assert.equal(tracker.signal(1, 12000, 10000), 'wait')
    tracker.hear(1, 10000, wordsFromHop('a wretch like me', 11000, 1000))
    assert.equal(tracker.signal(1, 12000, 10000), 'turn')
  })

  it('accepts a slurred last word', () => {
    const tracker = new LyricTracker([{ page: 0, lines: ['sing hallelujah'] }], 0)
    tracker.hear(0, 0, [{ word: 'sing', t: 100 }, { word: 'hallelujah', t: 400 }])
    assert.equal(tracker.signal(0, 500, 0), 'turn')
  })
})
