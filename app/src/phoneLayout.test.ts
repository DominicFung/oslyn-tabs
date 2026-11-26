import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BAND_THUMB_RESIZE_MODE, BAND_THUMB_SIZE, SCREEN_SAFE_EDGES, bandThumbFrame } from './phoneLayout.ts'

describe('band thumbnails', () => {
  it('uses a square cover image in the 72–96pt range', () => {
    const frame = bandThumbFrame()
    assert.ok(BAND_THUMB_SIZE >= 72 && BAND_THUMB_SIZE <= 96)
    assert.equal(frame.width, BAND_THUMB_SIZE)
    assert.equal(frame.height, BAND_THUMB_SIZE)
    assert.equal(frame.aspectRatio, 1)
    assert.equal(BAND_THUMB_RESIZE_MODE, 'cover')
  })
})

describe('screen safe area', () => {
  it('insets only the top edge', () => {
    assert.deepEqual([...SCREEN_SAFE_EDGES], ['top'])
  })
})
