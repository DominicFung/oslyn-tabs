import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { findLiveJamSong } from './liveJamSong'

const setSongs = [
  { songId: 'on-set', key: 'C' },
  { songId: 'also-on-set', key: 'G' },
]

describe('findLiveJamSong', () => {
  it('accepts a song that was added only to the live playlist', () => {
    const found = findLiveJamSong({
      songId: '0614cc4e-1aae-4b84-a319-b66945b38a6f',
      setSongs,
      playlist: [{ songId: 'on-set', key: 'C' }, { songId: '0614cc4e-1aae-4b84-a319-b66945b38a6f', key: 'D' }],
      queue: [],
    })
    assert.deepEqual(found, { index: 1, key: 'D' })
  })

  it('accepts a song the queue index points at on that playlist', () => {
    const found = findLiveJamSong({
      songId: 'queued',
      setSongs: [],
      playlist: [{ songId: 'other', key: 'C' }, { songId: 'queued', key: 'A' }],
      queue: [1],
    })
    assert.deepEqual(found, { index: 1, key: 'A' })
  })

  it('uses the set when the jam has no playlist of its own', () => {
    const found = findLiveJamSong({ songId: 'on-set', setSongs, queue: [0] })
    assert.deepEqual(found, { index: 0, key: 'C' })
  })

  it('does not treat a set song as live after the playlist dropped it', () => {
    const found = findLiveJamSong({
      songId: 'on-set',
      setSongs,
      playlist: [{ songId: 'someone-else', key: 'C' }],
      queue: [],
    })
    assert.equal(found, null)
  })

  it('rejects a song that is on neither the playlist nor the queue', () => {
    assert.equal(findLiveJamSong({
      songId: 'missing',
      setSongs,
      playlist: [{ songId: 'on-set', key: 'C' }],
      queue: [0],
    }), null)
  })
})
