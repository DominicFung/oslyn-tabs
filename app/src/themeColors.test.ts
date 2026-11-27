import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { jamSectionInk, jamTitleInk, lyricInk, resolveScheme, screenGradient } from './themeColors.ts'

describe('theme gradient', () => {
  it('keeps the light pink-to-lavender wash', () => {
    assert.deepEqual(screenGradient('light'), ['#e4bcbb', '#bb9bff'])
    assert.deepEqual(screenGradient(resolveScheme('light', 'dark')), ['#e4bcbb', '#bb9bff'])
    assert.deepEqual(screenGradient(resolveScheme('system', 'light')), ['#e4bcbb', '#bb9bff'])
    assert.deepEqual(screenGradient(resolveScheme('system', null)), ['#e4bcbb', '#bb9bff'])
  })

  it('uses the website dark navy-to-black wash when the setting or the device is dark', () => {
    const dark = ['#2a1a4a', '#000000']
    assert.deepEqual(screenGradient('dark'), dark)
    assert.deepEqual(screenGradient(resolveScheme('dark', 'light')), dark)
    assert.deepEqual(screenGradient(resolveScheme('system', 'dark')), dark)
    assert.notEqual(screenGradient('dark')[0], screenGradient('light')[0])
  })

  it('uses light lyric and title ink on the dark wash', () => {
    assert.equal(lyricInk('light'), '#5f28d4')
    assert.equal(lyricInk('dark'), '#bb9bff')
    assert.equal(lyricInk('dark', true), '#9ca3af')
    assert.equal(jamTitleInk('light'), '#4b5563')
    assert.equal(jamTitleInk('dark'), '#f9fafb')
    assert.equal(jamSectionInk('dark'), '#d1d5db')
  })
})
