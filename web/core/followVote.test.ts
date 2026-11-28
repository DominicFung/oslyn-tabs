import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { TurnVote, type VoteSignal } from './followVote.ts'

const wait = (over: Partial<Record<'chords' | 'lyrics' | 'takes', VoteSignal>> = {}) => ({
  chords: 'wait' as VoteSignal,
  lyrics: 'wait' as VoteSignal,
  takes: 'wait' as VoteSignal,
  ...over,
})

describe('two-of-three vote', () => {
  it('uses the chord decision alone when lyrics and past takes abstain', () => {
    const vote = new TurnVote()
    assert.equal(vote.push(0, wait({ chords: 'turn', lyrics: 'abstain', takes: 'abstain' })), true)
    const quiet = new TurnVote()
    assert.equal(quiet.push(0, wait({ lyrics: 'abstain', takes: 'abstain' })), false)
  })

  it('needs both remaining signals when one abstains', () => {
    const vote = new TurnVote()
    assert.equal(vote.push(0, wait({ chords: 'turn', lyrics: 'abstain' })), false)
    assert.equal(vote.push(400, wait({ takes: 'turn', lyrics: 'abstain' })), true)
  })

  it('turns when any two of three agree inside the window', () => {
    const vote = new TurnVote()
    assert.equal(vote.push(0, wait({ lyrics: 'turn' })), false)
    assert.equal(vote.push(1400, wait({ takes: 'turn' })), true)
  })

  it('does not pair a chord turn with a lyric turn that arrives after the window', () => {
    const vote = new TurnVote(1500)
    assert.equal(vote.push(0, wait({ chords: 'turn' })), false)
    assert.equal(vote.push(1501, wait({ lyrics: 'turn' })), false)
  })

  it('forgets an agreement after it fires so the next page starts clean', () => {
    const vote = new TurnVote()
    assert.equal(vote.push(0, wait({ chords: 'turn', lyrics: 'turn', takes: 'abstain' })), true)
    assert.equal(vote.push(100, wait({ takes: 'abstain' })), false)
  })
})
