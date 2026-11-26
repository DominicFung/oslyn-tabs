import assert from 'node:assert/strict'
import { detectKey, resolvedChordSheetKey } from './detectKey'

const lines = (chords: string[]) => chords.join(' ')

describe('detectKey', () => {
  it('hears C Em G D as G', () => {
    const found = detectKey(lines(['C', 'Em', 'G', 'D']))
    assert.equal(found?.key, 'G')
    assert.ok((found?.confidence || 0) > 0.5)
  })

  it('hears common major worship loops', () => {
    assert.equal(detectKey('G D Em C')?.key, 'G')
    assert.equal(detectKey('D A Bm G')?.key, 'D')
    assert.equal(detectKey('C G Am F')?.key, 'C')
    assert.equal(detectKey('[ch]E[/ch] [ch]B[/ch] [ch]C#m[/ch] [ch]A[/ch]')?.key, 'E')
  })

  it('separates relative major and minor by the opening chord', () => {
    assert.equal(detectKey('Am F C G')?.key, 'Am')
    assert.equal(detectKey('Em C G D')?.key, 'Em')
    assert.equal(detectKey('C G Am F')?.key, 'C')
  })

  it('returns nothing for an empty or chordless sheet', () => {
    assert.equal(detectKey(''), null)
    assert.equal(detectKey('   \n\n'), null)
    assert.equal(detectKey('[Verse]\nAmazing grace how sweet the sound'), null)
  })

  it('uses the root of a slash chord and keeps flat spelling', () => {
    assert.equal(detectKey('Bb/D Eb F Gm')?.key, 'Bb')
    assert.equal(detectKey('F# C# D#m B')?.key, 'F#')
  })

  it('still finds the key when a borrowed bVII shows up', () => {
    assert.equal(detectKey('C Bb F G C')?.key, 'C')
  })

  it('ignores capo notes and tab blocks', () => {
    const sheet = [
      'Capo 2',
      '[Verse]',
      'G  D  Em  C',
      '[tab]',
      'e|---3---2---0---',
      'B|---0---3---0---',
      '[/tab]',
    ].join('\n')
    assert.equal(detectKey(sheet)?.key, 'G')
  })

  it('counts repeated chords more than a one-off', () => {
    assert.equal(detectKey('G G G G D Em C')?.key, 'G')
  })

  it('reads sevenths, sus, and half-diminished chords as the parent key', () => {
    assert.equal(detectKey('Cmaj7 Dm7 Em7 Fmaj7 G7 Am7 Bm7b5')?.key, 'C')
    assert.equal(detectKey('Dsus4 A Bm G')?.key, 'D')
  })
})

describe('resolvedChordSheetKey', () => {
  const sheet = 'C Em G D'

  it('replaces a placeholder on the import path', () => {
    assert.equal(resolvedChordSheetKey({
      chordSheet: sheet, currentKey: 'C', providedKey: 'C', importPath: true,
    }), 'G')
  })

  it('keeps a key that arrived with a normal save', () => {
    assert.equal(resolvedChordSheetKey({
      chordSheet: sheet, currentKey: 'D', providedKey: 'D', importPath: false,
    }), undefined)
  })

  it('fills a key only when none is present outside an import', () => {
    assert.equal(resolvedChordSheetKey({
      chordSheet: sheet, currentKey: '', providedKey: '', importPath: false,
    }), 'G')
    assert.equal(resolvedChordSheetKey({
      chordSheet: sheet, currentKey: 'A', providedKey: '', importPath: false,
    }), undefined)
  })
})
