import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { baseSongTitle, chooseResult, songTitleKey, titleSearchValue, UgResult } from './choose'

describe('baseSongTitle', () => {
  const base = 'No Other Name'

  for (const suffix of [
    ' - Live',
    ' (Live)',
    ' [Live]',
    ' - Live at Red Rocks',
    ' - Live at the Hollywood Bowl 2019',
    ' (Live at Red Rocks)',
    ' - Remastered 2011',
    ' (Remastered 2011)',
    ' - Remastered',
    ' - Radio Edit',
    ' (Radio Edit)',
    ' - Acoustic',
    ' (Acoustic)',
    ' [Acoustic]',
    ' (feat. Gloria Kull)',
    ' (ft. Gloria Kull)',
    ' (featuring Gloria Kull)',
    ' [feat. Gloria Kull]',
    ' - Live (feat. Gloria Kull)',
    ' (feat. Gloria Kull) - Remastered 2011',
  ]) {
    it(`strips ${JSON.stringify(suffix)}`, () => {
      assert.equal(baseSongTitle(`${base}${suffix}`), base)
      assert.equal(songTitleKey(`${base}${suffix}`), 'no other name')
    })
  }

  it('keeps a title that merely contains those words', () => {
    assert.equal(baseSongTitle('Live Like We\'re Dying'), 'Live Like We\'re Dying')
    assert.equal(baseSongTitle('Alive'), 'Alive')
    assert.equal(baseSongTitle('Acoustic Soul'), 'Acoustic Soul')
    assert.equal(songTitleKey('No Other Name'), 'no other name')
  })

  it('still ignores a Ultimate Guitar version marker', () => {
    assert.equal(songTitleKey('No Other Name (ver 2)'), 'no other name')
    assert.equal(songTitleKey('No Other Name - Live (ver 3)'), 'no other name')
  })

  it('searches the base title and keeps a title that is only a suffix', () => {
    assert.equal(titleSearchValue('No Other Name - Live'), 'No Other Name')
    assert.equal(titleSearchValue(' - Live'), '- Live')
  })
})

describe('chooseResult', () => {
  const rows: UgResult[] = [
    { songName: 'No Other Name', artistName: 'Hillsong Worship', type: 'Chords', votes: 4000, rating: 4.8, tabUrl: 'https://tabs.example/hillsong', version: 1 },
    { songName: 'No Other Name (ver 2)', artistName: 'ICF Worship', type: 'Chords', votes: 12, rating: 4, tabUrl: 'https://tabs.example/icf', version: 2 },
    { songName: 'No Other Name', artistName: 'ICF Worship', type: 'Tab', votes: 900, rating: 5, tabUrl: 'https://tabs.example/tab', version: 1 },
    { songName: 'Other Song', artistName: 'ICF Worship', type: 'Chords', votes: 50, rating: 5, tabUrl: 'https://tabs.example/other', version: 1 },
  ]

  it('matches a live Spotify title to the base title and prefers the credited artist', () => {
    const chosen = chooseResult(rows, 'No Other Name - Live', 'ICF Worship, Gloria Kull')
    assert.equal(chosen?.tabUrl, 'https://tabs.example/icf')
    assert.equal(chosen?.fallback, false)
  })

  it('falls back to the highest-rated Chords chart when the artist has none', () => {
    const chosen = chooseResult(rows, 'No Other Name (Live)', 'Todd Dulaney')
    assert.equal(chosen?.tabUrl, 'https://tabs.example/hillsong')
    assert.equal(chosen?.fallback, true)
  })

  it('does not treat a different song as a title match', () => {
    assert.equal(chooseResult(rows, 'Acoustic Soul', 'ICF Worship'), null)
  })
})
