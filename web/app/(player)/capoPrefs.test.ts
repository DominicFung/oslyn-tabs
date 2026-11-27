import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { CAPO_VALUES } from './(controls)/sessionSteps.ts'
import { CAPO_FRETS, capoForSong, parseCapoPrefs, withSongCapo } from './capoPrefs.ts'

describe('capo prefs', () => {
  it('accepts the same frets as the capo dropdown', () => {
    assert.deepEqual([...CAPO_FRETS], [...CAPO_VALUES])
  })

  it('reads a legacy plain string as the default', () => {
    const prefs = parseCapoPrefs('2')
    assert.equal(prefs.default, '2')
    assert.deepEqual(prefs.bySong, {})
    assert.equal(capoForSong(prefs, 'song-a'), '2')
  })

  it('drops invalid frets and keeps a per-song capo', () => {
    const prefs = parseCapoPrefs(JSON.stringify({
      default: 'nope',
      bySong: { 'song-a': '4', 'song-b': '12', 'song-c': 2 },
    }))
    assert.equal(prefs.default, '0')
    assert.deepEqual(prefs.bySong, { 'song-a': '4' })
    assert.equal(capoForSong(prefs, 'song-a'), '4')
    assert.equal(capoForSong(prefs, 'missing'), '0')
    const saved = withSongCapo(prefs, 'song-a', '1')
    assert.equal(saved.default, '1')
    assert.equal(saved.bySong['song-a'], '1')
    assert.equal(withSongCapo(prefs, 'song-a', '13'), prefs)
  })
})
