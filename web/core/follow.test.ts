import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getChordByNumber } from './oslyn.ts'
import { ScoreFollower, chordTemplate, compactSession, cosine, partFileNames, semitonesBetween, sequenceFromSlides, stitchParts, templateChroma, transposeSymbol, rotateChroma, type FollowChord, type FollowChunkPart, type FollowManifest, type FollowSessionFile } from './follow.ts'

/** These cases test chord logic at 100ms frames. The page-length gate is covered on its own below. */
const chordOnly = { minDwell: 0, lateDwell: 0, orderMode: 'off' as const }

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

describe('chunk stitching', () => {
  const manifest = (chunks: FollowManifest['chunks']): FollowManifest => ({
    version: 1,
    songId: '5618be0c-13c8-4ed3-8adf-bcba7ee88429',
    sessionId: '2aaed060-5512-42cf-bb74-5be8a2db073e',
    title: 'Build My Life',
    chartKey: 'G',
    key: 'E',
    capo: 2,
    userAgent: 'test',
    appVersion: '0.1.0',
    commit: 'abc',
    recordedAt: '2026-11-27T19:30:42.574Z',
    chords: [{ symbol: 'G', page: 0, line: 0 }],
    pages: [{ page: 0, lines: ['verse'] }],
    chunks,
    finished: true,
  })

  const part = (chunk: number, frameT: number, eventT: number): FollowChunkPart => ({
    chunk,
    start: frameT,
    end: frameT + 1000,
    frames: [{
      t: frameT, chroma: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], energy: 0.2,
      detected: 'G', index: 0, line: 0, page: 0, matched: 'G', confidence: 1,
      transposition: 0, transpositionLocked: true, state: 'follow',
    }],
    events: [{ t: eventT, type: 'manual-correction', direction: 'next', pageBefore: chunk - 1, pageAfter: chunk }],
  })

  it('orders parts, keeps the later copy of a chunk, and uses the manifest header', () => {
    assert.deepEqual(partFileNames(1), { audio: 'part-0001.webm', json: 'part-0001.json' })
    const session = stitchParts(manifest([
      { part: 1, start: 0, end: 1000, session: 'part-0001.json' },
      { part: 2, start: 1000, end: 2000, session: 'part-0002.json', audio: 'part-0002.webm' },
    ]), [part(2, 1500, 1600), part(1, 100, 200), part(2, 9999, 9999)])
    assert.equal(session.key, 'E')
    assert.equal(session.chartKey, 'G')
    assert.equal(session.capo, 2)
    assert.deepEqual(session.frames.map((frame) => frame.t), [100, 9999])
    assert.deepEqual(session.events.map((event) => event.t), [200, 9999])
  })

  it('rounds chroma and confidence to three decimals', () => {
    const session = {
      version: 1, songId: 's', title: 't', key: 'E', capo: 2, userAgent: '', appVersion: '',
      commit: '', recordedAt: '2026-11-27T19:30:42.574Z', chords: [], pages: [],
      frames: [{
        t: 1, chroma: [0.123456, 0.5], energy: 0.2, detected: 'G', index: 0, line: 0, page: 0,
        matched: 'G', confidence: 0.55555, transposition: 0, transpositionLocked: true, state: 'follow',
      }],
      events: [{ t: 1, type: 'should-turn', page: 0, estimated: { index: 0, line: 0, page: 0, matched: 'G', confidence: 0.55555 } }],
    } as FollowSessionFile
    const compact = compactSession(session)
    assert.equal(compact.frames[0].chroma[0], 0.123)
    assert.equal(compact.frames[0].confidence, 0.556)
    assert.equal(compact.events[0].estimated?.confidence, 0.556)
    assert.equal(compact.frames[0].energy, 0.2)
  })
})

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
    const follower = new ScoreFollower([...verse, ...chorus, ...chorusAgain], { ...chordOnly, calibrationMs: 0, turnHold: 3, cooldownMs: 0 })
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
    const follower = new ScoreFollower([chord('C', 0), chord('G', 0), chord('Am', 1)], { ...chordOnly, calibrationMs: 0 })
    const played = play(follower, 'C', 25, 0)
    assert.equal(played.last.index, 0)
    assert.equal(played.last.matched, 'C')
    assert.equal(played.last.page, 0)
    assert.deepEqual(played.turns, [])
  })

  it('catches up after a missed chord and turns one page forward', () => {
    const follower = new ScoreFollower(
      [chord('C', 0, 0), chord('G', 0, 1), chord('Am', 1, 0), chord('F', 1, 1)],
      { ...chordOnly, calibrationMs: 0, turnHold: 3, turnConfidence: 0.45 },
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
    const follower = new ScoreFollower(chart, { ...chordOnly, calibrationMs: 8000, turnHold: 3 })
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
    const follower = new ScoreFollower(chart, { ...chordOnly, calibrationMs: 0, turnHold: 3, cooldownMs: 7000 })
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
    const follower = new ScoreFollower(chart, { ...chordOnly, calibrationMs: 0, turnHold: 3, cooldownMs: 0 })
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
    const follower = new ScoreFollower(chart, { ...chordOnly, calibrationMs: 0, turnHold: 3, cooldownMs: 7000 })
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
    const follower = new ScoreFollower([chord('C', 0), chord('G', 0), chord('Am', 1)], { ...chordOnly, calibrationMs: 0, turnHold: 3 })
    const sung = new Array(12).fill(0)
    sung[0] = 1
    const turns: number[] = []
    for (let t = 0; t < 40; t++) {
      const snap = follower.push(sung, 0.2, t * 100, 0)
      if (snap.turnTo != null) turns.push(snap.turnTo)
    }
    assert.deepEqual(turns, [])
  })

  it('does not skip ahead to the next page while the same chord is still held', () => {
    const follower = new ScoreFollower(
      [chord('G', 0, 0), chord('C', 0, 0), chord('G', 1, 0), chord('C', 1, 0)],
      { ...chordOnly, calibrationMs: 0, turnHold: 4, cooldownMs: 0, matchFloor: 0.6 },
    )
    const played = play(follower, 'G', 40, 0)
    assert.deepEqual(played.turns, [])
    assert.equal(played.last.page, 0)
    assert.equal(played.last.matched, 'G')
  })

  it('turns on the next page opening without a prior match on the current page', () => {
    const follower = new ScoreFollower(
      [chord('C', 0, 0), chord('Am', 1, 0)],
      { ...chordOnly, calibrationMs: 0, turnHold: 4, cooldownMs: 7000, matchFloor: 0.6 },
    )
    const played = play(follower, 'Am', 6, 0)
    assert.deepEqual(played.turns, [1])
  })

  it('keeps a nearly complete hold across one weak frame', () => {
    const follower = new ScoreFollower(
      [chord('C', 0, 0), chord('Am', 1, 0)],
      { ...chordOnly, calibrationMs: 0, turnHold: 4, cooldownMs: 0, matchFloor: 0.6 },
    )
    let t = 0
    let turned = false
    const weak = new Array(12).fill(0)
    weak[6] = 1
    for (let i = 0; i < 3; i++) {
      t += 100
      const snap = follower.push(templateChroma('Am'), 0.2, t, 0)
      if (snap.turnTo != null) turned = true
    }
    assert.equal(turned, false)
    t += 100
    follower.push(weak, 0.2, t, 0)
    for (let i = 0; i < 2; i++) {
      t += 100
      const snap = follower.push(templateChroma('Am'), 0.2, t, 0)
      if (snap.turnTo != null) turned = true
    }
    assert.equal(turned, true)
  })

  it('transposes a chart into the sounding jam key and leaves capo out of that shift', () => {
    assert.equal(semitonesBetween('G', 'E'), -3)
    assert.equal(transposeSymbol('G', -3), 'E')
    assert.equal(transposeSymbol('C/E', -3), 'A/C#')
  })

  it('ignores silent frames', () => {
    const follower = new ScoreFollower([chord('C', 0), chord('G', 1)], { ...chordOnly, calibrationMs: 0 })
    for (let t = 0; t < 30; t++) {
      const snap = follower.push(templateChroma('G'), 0, t * 100, 0)
      assert.equal(snap.index, 0)
      assert.equal(snap.turnTo, null)
      assert.equal(snap.transpositionLocked, false)
    }
  })
})

describe('page length gate', () => {
  // One progression repeated on every page, like the Build My Life verses.
  const loop = (page: number) => [chord('D', page, 0), chord('G', page, 0), chord('D/F#', page, 1), chord('G', page, 1)]
  const chart = [...loop(0), ...loop(1), ...loop(2)]

  function strum(follower: ScoreFollower, symbols: string[], chordMs: number, page: number, t0: number) {
    const turns: Array<{ t: number, page: number }> = []
    let t = t0
    for (const symbol of symbols) {
      for (let i = 0; i < chordMs / 100; i++) {
        t += 100
        const snap = follower.push(templateChroma(symbol), 0.2, t, page)
        if (snap.turnTo != null) { page = snap.turnTo; turns.push({ t, page }) }
      }
    }
    return { turns, page, t }
  }

  it('does not turn while the repeated progression is still on its first pass', () => {
    const follower = new ScoreFollower(chart, { calibrationMs: 0, defaultChordMs: 3000, orderMode: 'off' as const })
    const played = strum(follower, ['D', 'G', 'D/F#'], 3000, 0, 0)
    assert.deepEqual(played.turns, [])
  })

  it('turns near the end of the page once its expected length has passed', () => {
    const follower = new ScoreFollower(chart, { calibrationMs: 0, defaultChordMs: 3000, orderMode: 'off' as const })
    const played = strum(follower, ['D', 'G', 'D/F#', 'G', 'D', 'G'], 3000, 0, 0)
    assert.equal(played.turns.length, 1)
    assert.equal(played.turns[0].page, 1)
    assert.ok(played.turns[0].t >= 0.9 * 4 * 3000, `turned at ${played.turns[0].t}`)
  })

  it('learns the time per chord from manual next taps', () => {
    const follower = new ScoreFollower(chart, { calibrationMs: 0, defaultChordMs: 3000, orderMode: 'off' as const })
    follower.push(templateChroma('D'), 0.2, 0, 0)
    follower.push(templateChroma('D'), 0.2, 16000, 1)
    assert.equal(follower.chordMs(), 4000)
  })

  it('with the page-order check, waits for the last chord before turning', () => {
    const follower = new ScoreFollower(chart, { calibrationMs: 0, defaultChordMs: 1000, minDwell: 0, lateDwell: 0, orderMode: 'and', orderChordMs: 0 })
    // First three chords of a four-chord page: the opening of the next page shows up, but the page isn't played through.
    const early = strum(follower, ['D', 'G', 'D/F#'], 1000, 0, 0)
    assert.deepEqual(early.turns, [])
    const later = new ScoreFollower(chart, { calibrationMs: 0, defaultChordMs: 1000, minDwell: 0, lateDwell: 0, orderMode: 'and', orderChordMs: 0 })
    const played = strum(later, ['D', 'G', 'D/F#', 'G', 'D', 'G'], 1000, 0, 0)
    assert.equal(played.turns.length, 1)
    assert.equal(played.turns[0].page, 1)
  })
})
