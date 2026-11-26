import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  appendQueue,
  mergeSongChange,
  orderSongs,
  shouldSearchSpotify,
  spotifyTrackUrl,
  withImportedSheet,
  type PlaylistRow,
} from './jamPlaylist.ts'

const row = (id: string, title: string, sheet = 'C\nline'): PlaylistRow => ({
  key: 'C',
  song: { songId: id, title, chordSheet: sheet, chordSheetKey: 'C' },
})

describe('orderSongs', () => {
  it('follows the server song id order and drops songs that left the jam', () => {
    const next = orderSongs([row('a', 'One'), row('b', 'Two'), row('c', 'Three')], ['c', 'a'])
    assert.deepEqual(next.map((item) => item.song.songId), ['c', 'a'])
  })
})

describe('mergeSongChange', () => {
  it('appends a new song and keeps an existing chart when the event has none', () => {
    const prev = [row('a', 'One', '[Verse]\nC G\nHello')]
    const added = mergeSongChange(prev, {
      index: 1,
      key: 'G',
      song: { songId: 'b', title: 'Two', chordSheet: '', chordSheetKey: 'G' },
    })
    assert.equal(added.length, 2)
    assert.equal(added[1].song.title, 'Two')
    assert.equal(added[1].key, 'G')

    const kept = mergeSongChange(prev, {
      index: 0,
      key: 'D',
      song: { songId: 'a', title: 'One', chordSheet: '   ', chordSheetKey: 'D' },
    })
    assert.equal(kept[0].song.chordSheet, '[Verse]\nC G\nHello')
    assert.equal(kept[0].key, 'D')
    assert.equal(kept[0].song.chordSheetKey, 'D')
  })
})

describe('withImportedSheet', () => {
  it('fills the chart the importer finished', () => {
    const next = withImportedSheet([row('a', 'One', '')], 'a', 'C G\nHello')
    assert.equal(next[0].song.chordSheet, 'C G\nHello')
    assert.equal(next[0].song.chordSheetKey, 'C')
  })
})

describe('queue and spotify search', () => {
  it('appends a set index without dropping the songs already queued', () => {
    assert.deepEqual(appendQueue([0, null, 2], 1), [0, 2, 1])
  })

  it('asks Spotify only when the library has fewer than three matches', () => {
    assert.equal(shouldSearchSpotify(true, 'grace', 'done', 2), true)
    assert.equal(shouldSearchSpotify(true, 'grace', 'done', 3), false)
    assert.equal(shouldSearchSpotify(true, 'grace', 'loading', 0), false)
    assert.equal(shouldSearchSpotify(false, 'grace', 'error', 0), false)
    assert.equal(spotifyTrackUrl('abc 1'), 'https://open.spotify.com/track/abc%201')
  })
})
