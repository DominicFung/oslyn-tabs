import assert from 'node:assert/strict'
import { readFileSync } from 'fs'
import { join } from 'path'
import { chordsOnLine, cleanChart, isChordLine, isChordToken, phrasesFromChart } from './chart'
import { wikiToChart } from './ug'

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', 'charts', name), 'utf8')

describe('chord tokens', () => {
  const tokens = [
    'C', 'Am', 'C#', 'Bb', 'Gadd11', 'Fsus2', 'Fsus2/C', 'Gm/Bb', 'Cadd9', 'Dsus2',
    'N.C.', 'NC', 'Cmaj7', 'Cm7', 'C7', 'Cdim', 'Caug', 'C+', 'Csus4', 'Csus2',
    'C5', 'C6', 'C9', 'C11', 'C13', 'C6/9', 'Cmaj9', 'Cmaj11', 'Cmaj13', 'Cm7b5',
    'Cdim7', 'Cadd2', 'Cadd4', 'Cadd13', 'C7b9', 'C7#9', 'C7#11', 'C7b13', 'C7(b9)',
    'C7(#9)', 'G/B', 'D/F#', 'C#m7b5', 'F#m', 'Bbm', 'Asus2',
  ]
  it.each(tokens)('accepts %s', (token) => {
    assert.equal(isChordToken(token), true)
  })

  it('rejects fret diagrams and words', () => {
    for (const token of ['xx0232', 'x3x030', 'x1x03(3)', 'hello', 'Tonight', 'unwritten']) {
      assert.equal(isChordToken(token), false)
    }
  })

  it('reads a chord line that uses dashes or bars', () => {
    assert.deepEqual(chordsOnLine('D - G - A - G'), ['D', 'G', 'A', 'G'])
    assert.deepEqual(chordsOnLine('D | G | A | G'), ['D', 'G', 'A', 'G'])
    assert.equal(isChordLine('C  Gadd11  Am  Fsus2'), true)
    assert.deepEqual(chordsOnLine('C  Gadd11  Am  Fsus2'), ['C', 'Gadd11', 'Am', 'Fsus2'])
    assert.deepEqual(chordsOnLine('Fsus2 Gadd11 Fsus2/C Gadd11'), ['Fsus2', 'Gadd11', 'Fsus2/C', 'Gadd11'])
  })
})

describe('chart cleanup', () => {
  const kid = cleanChart(wikiToChart(fixture('im-just-a-kid.wiki.txt')))
  const unwritten = cleanChart(wikiToChart(fixture('unwritten.wiki.txt')))
  const atw = cleanChart(wikiToChart(fixture('all-too-well.wiki.txt')))

  it('keeps chordless lyrics in I\'m Just a Kid', () => {
    const phrases = phrasesFromChart(kid)
    const lyrics = phrases.map((phrase) => phrase.lyric.trim())
    assert.ok(lyrics.includes('And here it goes ..'))
    assert.ok(lyrics.includes('Tonight'))
    const goes = phrases.find((phrase) => phrase.lyric.trim() === 'And here it goes ..')
    const tonight = phrases.find((phrase) => phrase.lyric.trim() === 'Tonight')
    assert.deepEqual(goes?.chords, [])
    assert.deepEqual(tonight?.chords, [])
  })

  it('keeps every chordless lyric under the single D in Unwritten', () => {
    const phrases = phrasesFromChart(unwritten)
    const lyrics = phrases.map((phrase) => phrase.lyric.trim())
    for (const line of [
      'I am unwritten',
      'Can\'t read my mind, I\'m undefined',
      'I\'m just beginning',
      'The pen\'s in my hand, ending unplanned',
    ]) {
      assert.ok(lyrics.includes(line), line)
    }
    const first = phrases.find((phrase) => phrase.lyric.includes('unwritten'))
    assert.deepEqual(first?.chords, ['D'])
    assert.deepEqual(phrases.find((phrase) => phrase.lyric.includes('undefined'))?.chords, [])
    assert.equal(unwritten.includes('xx0232'), false)
    assert.equal(unwritten.includes('e|-'), false)
    assert.equal(unwritten.includes('Guitar 1'), false)
    assert.equal(unwritten.includes('Riff x4'), false)
    assert.equal(unwritten.includes('Play riff'), false)
    assert.ok(unwritten.includes('[Verse 1]'))
  })

  it('keeps Gadd11 and Fsus2/C in All Too Well', () => {
    const phrases = phrasesFromChart(atw)
    const chords = phrases.flatMap((phrase) => phrase.chords)
    assert.ok(chords.includes('Gadd11'))
    assert.ok(chords.includes('Fsus2'))
    assert.ok(chords.includes('Fsus2/C'))
    assert.ok(phrases.some((phrase) => phrase.lyric.includes('I walked through the door')))
  })
})
