import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { acceptChordLineWidth, acceptMeasuredWidth, chordOffsets, commitCount, placeChordLine, queueMeasuredHeight, slideLyricText, textLayoutWidth } from './lyricMeasure.ts'

describe('pooled layout events', () => {
  it('reads the height before the event is nulled', () => {
    const event: { nativeEvent: { layout: { width: number, height: number } | null } } = {
      nativeEvent: { layout: { width: 360, height: 240 } },
    }
    let apply: ((previous: number) => number) | undefined
    queueMeasuredHeight(event, (update) => { apply = update })
    event.nativeEvent.layout = null
    assert.equal(apply!(0), 240)
    assert.equal(apply!(240), 240)
  })

  it('keeps a long lyric whole, with chords on the same columns past the screen', () => {
    const lyric = 'Worthy of every breath we could ever breathe'
    const shown = slideLyricText(`  ${lyric}  `)
    assert.equal(shown, lyric)
    assert.equal(shown.includes('...'), false)
    assert.equal(shown.includes('…'), false)
    const columns = [0, 11, 21, 30]
    assert.deepEqual(chordOffsets(shown, columns, 8), columns.map((column) => column * 8))
    assert.ok(columns[3] < shown.length)
  })

  it('reads the text width before the event is nulled', () => {
    const event: { nativeEvent: { lines: Array<{ width: number }> | null } } = {
      nativeEvent: { lines: [{ width: 128.4 }] },
    }
    const width = textLayoutWidth(event)
    event.nativeEvent.lines = null
    assert.equal(Math.round(width), 128)
    assert.equal(textLayoutWidth(event), 0)
  })
})

describe('chords before the lyric', () => {
  const labels = ['E', 'A', 'E/B', 'A']
  const chip = (label: string) => Math.max(1, label.length) * 8 + 12 + 8

  it('spaces E A E/B A in front of Worthy without overlap', () => {
    const placed = placeChordLine({
      lyric: 'Worthy of every song we could ever sing',
      positions: [0, 2, 5, 10],
      labels,
      charWidth: 8,
    })
    assert.equal(placed.offsets.length, 4)
    for (let i = 1; i < placed.offsets.length; i++) {
      assert.ok(placed.offsets[i] >= placed.offsets[i - 1] + chip(labels[i - 1]))
    }
    assert.ok(placed.lyricIndent >= placed.offsets[3] + chip(labels[3]))
  })

  it('separates chords that share column 0 or sit closer than their chips', () => {
    const columnZero = placeChordLine({
      lyric: 'Worthy',
      positions: [0, 0, 0, 0],
      labels,
      charWidth: 8,
    })
    for (let i = 1; i < columnZero.offsets.length; i++) {
      assert.ok(columnZero.offsets[i] >= columnZero.offsets[i - 1] + chip(labels[i - 1]))
    }
    assert.ok(columnZero.lyricIndent >= columnZero.offsets[3] + chip('A'))

    const tight = placeChordLine({
      lyric: 'Worthy',
      positions: [0, 1],
      labels: ['E/B', 'A'],
      charWidth: 8,
    })
    assert.ok(tight.offsets[1] >= tight.offsets[0] + chip('E/B'))
    assert.ok(tight.lyricIndent >= tight.offsets[1] + chip('A'))
  })
})

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
