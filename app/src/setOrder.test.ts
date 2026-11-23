import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { moveSong, nextSetKey, setSongInputs } from './setOrder.ts'

describe('set order', () => {
  it('persists the visible order the way the website updateSet mutation does', () => {
    const songs = [
      { songId: 'a', key: 'C' },
      { songId: 'b', key: 'G' },
      { songId: 'c', key: 'D' },
    ]
    const moved = moveSong(songs, 0, 2)
    assert.deepEqual(setSongInputs(moved), [
      { songId: 'b', key: 'G', order: 0 },
      { songId: 'c', key: 'D', order: 1 },
      { songId: 'a', key: 'C', order: 2 },
    ])
  })

  it('cycles keys', () => {
    assert.equal(nextSetKey('C'), 'C#')
    assert.equal(nextSetKey('B'), 'C')
  })
})