import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getChordByNumber } from './oslyn.ts'
import { ScoreFollower, chordTemplate, cosine, sequenceFromSlides, templateChroma, rotateChroma, type FollowChord } from './follow.ts'

function chord(symbol: string, page: number, line = 0): FollowChord {
  const template = chordTemplate(symbol)
  if (!template) throw new Error(`bad chord ${symbol}`)
  return { symbol, page, line, template }
}

function play(follower: ScoreFollower, symbol: string, frames: number, page: number, transpose = 0, t0 = 0) {
  const turns: number[] = []
  let elapsed = t0
  let last = follower.push(templateChroma(symbol), 0, elapsed, page)
  for (let i = 0; i < frames; i++) {
    elapsed += 100
    const chroma = rotateChroma(templateChroma(symbol), transpose)
    last = follower.push(chroma, 0.2, elapsed, page)
    if (last.turnTo != null) {
      turns.push(last.turnTo)
      page = last.turnTo
    }
  }
  return { last, turns, page, elapsed }
}

describe('chord templates', () => {
  it('weights slash bass and falls back to root plus fifth', () => {
    const g = chordTemplate('G')
    const slash = chordTemplate('G/B')
    const add9 = chordTemplate('Cadd9')
    assert.ok(g && slash && add9)
    assert.ok(cosine(slash!, g!) < 0.999)
    assert.ok(slash![11] > g![11])
    const fifth = chordTemplate('C')!
    const rootFifth = [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0]
    rootFifth[0] = 1
    assert.ok(cosine(add9!, rootFifth.map((value, index) => index === 0 || index === 7 ? 1 : 0)) > 0.9)
    assert.ok(cosine(fifth, chordTemplate('Cmaj')!) > 0.99)
  })

  it('reads chart chords off the slides, one page at a time', () => {
    const sequence = sequenceFromSlides({
      pages: [
        { lines: [{ chords: [{ chord: 0, isMinor: false, decorator: '' }, { chord: 7, isMinor: false, decorator: '7' }] }] },
        { lines: [{ chords: [] }, { chords: [{ chord: 9, isMinor: true, decorator: '' }] }] },
      ],
    }, 'C', getChordByNumber)
    assert.deepEqual(sequence.map((item) => item.symbol), ['C', 'G7', 'Am'])
    assert.deepEqual(sequence.map((item) => item.page), [0, 0, 1])
    assert.equal(sequence[2].line, 1)
  })
})

describe('score following', () => {
  const verse = [chord('C', 0, 0), chord('G', 0, 0), chord('Am', 0, 1), chord('F', 0, 1)]
  const chorus = [chord('C', 1, 0), chord('G', 1, 0), chord('Am', 1, 1), chord('F', 1, 1)]
  const chorusAgain = [chord('C', 2, 0), chord('G', 2, 0), chord('Am', 2, 1), chord('F', 2, 1)]

  it('follows a repeated chorus forward instead of jumping back to the first copy', () => {
    const follower = new ScoreFollower([...verse, ...chorus, ...chorusAgain], { calibrationMs: 0, turnHold: 3, cooldownMs: 0 })
    let page = 0
    let clock = 0
    for (const group of [verse, chorus, chorusAgain]) {
      for (const step of group) {
        const played = play(follower, step.symbol, 8, page, 0, clock)
        page = played.page
        clock = played.elapsed
      }
    }
    assert.equal(page, 2)
    const stuck = follower.push(templateChroma('F'), 0.2, clock + 100, page)
    assert.equal(stuck.page, 2)
    assert.equal(stuck.matched, 'F')
    assert.equal(stuck.turnTo, null)
  })

  it('stays on a held chord', () => {
    const follower = new ScoreFollower([chord('C', 0), chord('G', 0), chord('Am', 1)], { calibrationMs: 0 })
    const played = play(follower, 'C', 25, 0)
    assert.equal(played.last.index, 0)
    assert.equal(played.last.matched, 'C')
    assert.equal(played.last.page, 0)
    assert.deepEqual(played.turns, [])
  })

  it('catches up after a missed chord and turns one page forward', () => {
    const follower = new ScoreFollower(
      [chord('C', 0, 0), chord('G', 0, 1), chord('Am', 1, 0), chord('F', 1, 1)],
      { calibrationMs: 0, turnHold: 3, turnConfidence: 0.45 },
    )
    let played = play(follower, 'C', 8, 0)
    played = play(follower, 'Am', 12, played.page, 0, played.elapsed)
    assert.ok(played.last.index >= 2)
    assert.equal(played.last.matched, 'Am')
    assert.ok(played.turns.includes(1))
    const back = play(follower, 'C', 10, played.page, 0, played.elapsed)
    assert.ok(!back.turns.some((page) => page < played.page))
    assert.ok(back.page >= played.page)
  })

  it('locks a capo of +2 during the opening and still tracks the written chart', () => {
    const chart = [chord('C', 0), chord('G', 0), chord('Am', 1), chord('F', 1)]
    const follower = new ScoreFollower(chart, { calibrationMs: 8000, turnHold: 3 })
    let page = 0
    let clock = 0
    let locked = false
    for (const step of chart) {
      const played = play(follower, step.symbol, 25, page, 2, clock)
      page = played.page
      clock = played.elapsed
      locked = played.last.transpositionLocked
    }
    assert.equal(locked, true)
    const snap = follower.push(rotateChroma(templateChroma('F'), 2), 0.2, clock + 100, page)
    assert.equal(snap.transposition, 2)
    assert.equal(snap.matched, 'F')
    assert.ok(snap.page >= 1)
  })

  it('does not turn again on rapid false matches during the cooldown', () => {
    const chart = [chord('C', 0), chord('G', 0), chord('Am', 1), chord('F', 1), chord('C', 2), chord('G', 2)]
    const follower = new ScoreFollower(chart, { calibrationMs: 0, turnHold: 3, cooldownMs: 7000 })
    let played = play(follower, 'C', 6, 0)
    played = play(follower, 'G', 6, played.page, 0, played.elapsed)
    played = play(follower, 'Am', 8, played.page, 0, played.elapsed)
    assert.deepEqual(played.turns, [1])
    const spam = play(follower, 'C', 30, played.page, 0, played.elapsed)
    assert.deepEqual(spam.turns, [])
    assert.equal(spam.page, 1)
  })

  it('re-anchors when the page changes by hand and does not turn backwards', () => {
    const chart = [chord('C', 0), chord('G', 0), chord('Am', 1, 0), chord('F', 1, 1), chord('C', 2)]
    const follower = new ScoreFollower(chart, { calibrationMs: 0, turnHold: 3, cooldownMs: 0 })
    let played = play(follower, 'C', 6, 0)
    played = play(follower, 'G', 6, played.page, 0, played.elapsed)
    const jumped = follower.push(templateChroma('Am'), 0.2, played.elapsed + 100, 1)
    assert.equal(jumped.turnTo, null)
    assert.equal(jumped.page, 1)
    assert.equal(jumped.matched, 'Am')
    assert.equal(jumped.index, 2)
    const back = follower.push(templateChroma('C'), 0.2, played.elapsed + 200, 0)
    assert.equal(back.turnTo, null)
    assert.equal(back.page, 0)
    assert.equal(back.matched, 'C')
    assert.equal(back.index, 0)
  })

  it('waits out the cooldown and hears the new page before the next turn', () => {
    const chart = [chord('C', 0), chord('G', 0), chord('Am', 1), chord('F', 1), chord('C', 2), chord('D', 2)]
    const follower = new ScoreFollower(chart, { calibrationMs: 0, turnHold: 3, cooldownMs: 7000 })
    let played = play(follower, 'C', 6, 0)
    played = play(follower, 'G', 6, played.page, 0, played.elapsed)
    played = play(follower, 'Am', 8, played.page, 0, played.elapsed)
    assert.deepEqual(played.turns, [1])
    const early = play(follower, 'C', 10, played.page, 0, played.elapsed)
    assert.deepEqual(early.turns, [])
    let clock = played.elapsed + 7000
    let page = played.page
    const settled = play(follower, 'Am', 4, page, 0, clock)
    clock = settled.elapsed
    page = settled.page
    const second = play(follower, 'F', 6, page, 0, clock)
    clock = second.elapsed
    page = second.page
    const next = play(follower, 'C', 8, page, 0, clock)
    assert.deepEqual(settled.turns, [])
    assert.deepEqual(second.turns, [])
    assert.deepEqual(next.turns, [2])
  })

  it('does not turn on a single sung pitch', () => {
    const follower = new ScoreFollower([chord('C', 0), chord('G', 0), chord('Am', 1)], { calibrationMs: 0, turnHold: 3 })
    const sung = new Array(12).fill(0)
    sung[0] = 1
    const turns: number[] = []
    for (let t = 0; t < 40; t++) {
      const snap = follower.push(sung, 0.2, t * 100, 0)
      if (snap.turnTo != null) turns.push(snap.turnTo)
    }
    assert.deepEqual(turns, [])
  })

  it('ignores silent frames', () => {
    const follower = new ScoreFollower([chord('C', 0), chord('G', 1)], { calibrationMs: 0 })
    for (let t = 0; t < 30; t++) {
      const snap = follower.push(templateChroma('G'), 0, t * 100, 0)
      assert.equal(snap.index, 0)
      assert.equal(snap.turnTo, null)
      assert.equal(snap.transpositionLocked, false)
    }
  })
})
