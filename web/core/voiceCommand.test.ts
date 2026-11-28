import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { manualDirection, readVoiceCommand } from './voiceCommand.ts'

const none: { t: number, text: string }[] = []

describe('voice commands', () => {
  it('accepts an isolated next, back, previous, and next page', () => {
    assert.equal(readVoiceCommand({ text: 'Next', t: 5000, recent: none, lyricLines: ['amazing grace'], lastFiredAt: null }), 'next')
    assert.equal(readVoiceCommand({ text: 'go back', t: 5000, recent: none, lyricLines: [], lastFiredAt: null }), 'back')
    assert.equal(readVoiceCommand({ text: 'previous', t: 5000, recent: none, lyricLines: [], lastFiredAt: null }), 'back')
    assert.equal(readVoiceCommand({ text: 'next page', t: 5000, recent: none, lyricLines: [], lastFiredAt: null }), 'next')
    assert.equal(manualDirection('back'), 'prev')
    assert.equal(manualDirection('next'), 'next')
  })

  it('ignores next when that word is in the current or adjacent lyrics', () => {
    const lyrics = ['I will see you next time', 'hold on']
    assert.equal(readVoiceCommand({ text: 'next', t: 4000, recent: none, lyricLines: lyrics, lastFiredAt: null }), null)
    assert.equal(readVoiceCommand({ text: 'back', t: 4000, recent: none, lyricLines: lyrics, lastFiredAt: null }), 'back')
  })

  it('ignores a command buried in a longer sung phrase', () => {
    assert.equal(readVoiceCommand({
      text: 'I will see you next time',
      t: 4000,
      recent: none,
      lyricLines: ['I will see you next time'],
      lastFiredAt: null,
    }), null)
    assert.equal(readVoiceCommand({
      text: 'next',
      t: 4000,
      recent: [{ t: 3500, text: 'how sweet the sound' }],
      lyricLines: ['amazing grace'],
      lastFiredAt: null,
    }), null)
  })

  it('waits out the cooldown so one utterance does not fire twice', () => {
    assert.equal(readVoiceCommand({ text: 'next', t: 5000, recent: none, lyricLines: [], lastFiredAt: 4000 }), null)
    assert.equal(readVoiceCommand({ text: 'next', t: 6200, recent: none, lyricLines: [], lastFiredAt: 4000 }), 'next')
  })
})
