import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { gearModalFrame, lyricPlacement, lyricVisualBounds } from './jamLayout.ts'

describe('gear modal', () => {
  it('fits a landscape phone inside the safe area', () => {
    const frame = gearModalFrame(
      { width: 914, height: 411 },
      { top: 24, right: 48, bottom: 0, left: 48 },
    )
    assert.equal(frame.width, 914 - 48 - 48 - 16)
    assert.equal(frame.height, 411 - 24 - 16)
    assert.equal(frame.top, 24 + 8)
    assert.equal(frame.left, 48 + 8)
    assert.ok(frame.top + frame.height <= 411)
    assert.ok(frame.left + frame.width <= 914)
  })

  it('fits a portrait phone inside the safe area', () => {
    const frame = gearModalFrame(
      { width: 411, height: 914 },
      { top: 48, right: 0, bottom: 24, left: 0 },
    )
    assert.equal(frame.width, 411 - 16)
    assert.equal(frame.height, 914 - 48 - 24 - 16)
    assert.equal(frame.top, 48 + 8)
    assert.ok(frame.top + frame.height <= 914 - 24)
  })
})

describe('lyric placement', () => {
  it('centers a short line in the stage below the header', () => {
    const stage = { width: 800, height: 280 }
    const block = { width: 220, height: 72 }
    const place = lyricPlacement(stage, block)
    assert.equal(place.scale, 1)
    assert.equal(place.left, 800 / 2 - 110)
    assert.equal(place.top, 280 / 2 - 36)
    const visual = lyricVisualBounds(stage, block)
    assert.ok(Math.abs((visual.left + visual.right) / 2 - stage.width / 2) < 0.01)
    assert.ok(Math.abs((visual.top + visual.bottom) / 2 - stage.height / 2) < 0.01)
  })

  it('scales a long line so the chords stay inside the padded stage', () => {
    const stage = { width: 400, height: 220 }
    const block = { width: 900, height: 72 }
    const visual = lyricVisualBounds(stage, block, 16)
    assert.ok(visual.scale < 1)
    assert.ok(visual.left >= 16 - 0.01)
    assert.ok(visual.right <= stage.width - 16 + 0.01)
    assert.ok(visual.top >= 16 - 0.01)
    assert.ok(visual.bottom <= stage.height - 16 + 0.01)
  })

  it('scales a tall page that would otherwise overflow portrait', () => {
    const stage = { width: 360, height: 500 }
    const block = { width: 200, height: 900 }
    const visual = lyricVisualBounds(stage, block, 16)
    assert.ok(visual.scale < 1)
    assert.ok(visual.bottom <= stage.height - 16 + 0.01)
    assert.ok(visual.top >= 16 - 0.01)
  })
})
