import assert from 'node:assert/strict'
import { readFileSync } from 'fs'
import { join } from 'path'
import { chordsOnLine, cleanChart, decodeEntities, isChordLine, isChordToken, phrasesFromChart } from './chart'
import { wikiToChart } from './ug'

const fixture = (name: string) => readFileSync(join(__dirname, 'fixtures', 'charts', name), 'utf8')

describe('chord tokens', () => {
  const tokens = [
    'C', 'Am', 'C#', 'Bb', 'Gadd11', 'Fsus2', 'Fsus2/C', 'Gm/Bb', 'Cadd9', 'Dsus2',
    'Cmaj7', 'Cm7', 'C7', 'Cdim', 'Caug', 'C+', 'Csus4', 'Csus2',
    'C5', 'C6', 'C9', 'C11', 'C13', 'C6/9', 'Cmaj9', 'Cmaj11', 'Cmaj13', 'Cm7b5',
    'Cdim7', 'Cadd2', 'Cadd4', 'Cadd13', 'C7b9', 'C7#9', 'C7#11', 'C7b13', 'C7(b9)',
    'C7(#9)', 'G/B', 'D/F#', 'C#m7b5', 'F#m', 'Bbm', 'Asus2',
  ]
  it.each(tokens)('accepts %s', (token) => {
    assert.equal(isChordToken(token), true)
  })

  it('rejects fret diagrams, words, and no-chord marks', () => {
    for (const token of ['xx0232', 'x3x030', 'x1x03(3)', 'hello', 'Tonight', 'unwritten', 'N.C.', 'NC', 'N.C', '(N.C.)']) {
      assert.equal(isChordToken(token), false)
    }
  })

  it('keeps F beside N.C. and still treats a lone N.C. row as chords', () => {
    assert.equal(isChordLine('F    N.C.'), true)
    assert.deepEqual(chordsOnLine('F    N.C.'), ['F'])
    assert.equal(isChordLine('N.C.'), true)
    assert.equal(isChordLine('(N.C.)'), true)
    assert.deepEqual(chordsOnLine('N.C.'), [])
    assert.deepEqual(chordsOnLine('NC'), [])
  })

  it('reads a chord line that uses dashes or bars', () => {
    assert.deepEqual(chordsOnLine('D - G - A - G'), ['D', 'G', 'A', 'G'])
    assert.deepEqual(chordsOnLine('D | G | A | G'), ['D', 'G', 'A', 'G'])
    assert.equal(isChordLine('C  Gadd11  Am  Fsus2'), true)
    assert.deepEqual(chordsOnLine('C  Gadd11  Am  Fsus2'), ['C', 'Gadd11', 'Am', 'Fsus2'])
    assert.deepEqual(chordsOnLine('Fsus2 Gadd11 Fsus2/C Gadd11'), ['Fsus2', 'Gadd11', 'Fsus2/C', 'Gadd11'])
  })
})

describe('leading meta', () => {
  it('drops everything before the first section header', () => {
    const chart = cleanChart([
      'Once upon a time there was a song',
      'Capo 3rd fret',
      'https://www.youtube.com/watch?v=example',
      '',
      '[Verse 1]',
      'C',
      'Hello',
    ].join('\n'))
    assert.equal(chart.startsWith('[Verse 1]'), true)
    assert.equal(chart.includes('Once upon a time'), false)
    assert.equal(chart.includes('Capo'), false)
    assert.equal(chart.includes('youtube'), false)
    assert.ok(chart.includes('Hello'))
  })

  it('drops only pre-chord meta when the song has no headers', () => {
    const chart = cleanChart([
      'Based on the studio version',
      'https://www.youtube.com/watch?v=7MAs5b7EJyc',
      'Capo 3rd fret',
      'C',
      'Hello',
      'https://example.com/later',
      'I still love you',
    ].join('\n'))
    assert.equal(chart.includes('Based on'), false)
    assert.equal(chart.includes('youtube'), false)
    assert.equal(chart.includes('Capo'), false)
    assert.equal(chart.includes('example.com'), false)
    assert.ok(chart.includes('Hello'))
    assert.ok(chart.includes('I still love you'))
  })

  it('drops Babydoll credit lines and an intro that is only meta', () => {
    const chart = cleanChart([
      'Based on the studio version',
      'https://www.youtube.com/watch?v=7MAs5b7EJyc',
      'Capo 3rd fret',
      'For original, transpose -3',
      '* = 1 strum',
      '',
      '[Intro]',
      'Based on the studio version',
      'https://www.youtube.com/watch?v=7MAs5b7EJyc',
      '',
      '[Verse 1]',
      'D                                 Gsus2                        Bm7',
      "  There's something about how you dance, you got the cool confidence",
    ].join('\n'))
    assert.equal(chart.includes('[Intro]'), false)
    assert.equal(chart.includes('Based on'), false)
    assert.equal(chart.includes('youtube'), false)
    assert.equal(chart.includes('Capo'), false)
    assert.equal(chart.includes('transpose'), false)
    assert.equal(chart.startsWith('[Verse 1]'), true)
    assert.ok(chart.includes("There's something about how you dance"))
  })

  it('keeps a chordless lyric at the start of a later section', () => {
    const phrases = phrasesFromChart([
      '[Verse 1]',
      'C',
      'Hello',
      '',
      '[Bridge]',
      'I still love you',
      'G',
      'more',
    ].join('\n'))
    const lyrics = phrases.map((phrase) => phrase.lyric.trim())
    assert.ok(lyrics.includes('I still love you'))
    assert.deepEqual(phrases.find((phrase) => phrase.lyric.trim() === 'I still love you')?.chords, [])
    assert.equal(phrases.find((phrase) => phrase.lyric.trim() === 'I still love you')?.section, 'Bridge')
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

  it('decodes No Other Name entities and drops N.C. without losing the lyric', () => {
    const sheet = [
      '[Verse 1]',
      'F    N.C.',
      'I&rsquo;ll sing:',
      '',
      '[Chorus 1]',
      'G                   F            Am  Am7 G',
      'You conquered the grave, You&rsquo;re risen',
      '',
      'N.C.',
      'You&amp;rsquo;re risen',
      '',
      '(N.C.)',
      'I&#39;ll sing again',
    ].join('\n')
    const phrases = phrasesFromChart(sheet)
    const sing = phrases.find((phrase) => phrase.lyric.includes('sing:'))
    assert.equal(sing?.lyric, 'I\u2019ll sing:')
    assert.deepEqual(sing?.chords, ['F'])
    const risen = phrases.filter((phrase) => phrase.lyric.includes('risen'))
    assert.equal(risen.length, 2)
    assert.equal(risen[0].lyric, 'You conquered the grave, You\u2019re risen')
    assert.deepEqual(risen[0].chords, ['G', 'F', 'Am', 'Am7', 'G'])
    assert.equal(risen[1].lyric, 'You\u2019re risen')
    assert.deepEqual(risen[1].chords, [])
    assert.equal(phrases.some((phrase) => /N\.?C\.?/.test(phrase.lyric)), false)
    assert.equal(phrases.flatMap((phrase) => phrase.chords).some((chord) => /N\.?C/.test(chord)), false)
    const again = phrases.find((phrase) => phrase.lyric.includes('again'))
    assert.equal(again?.lyric, 'I\'ll sing again')
    assert.deepEqual(again?.chords, [])
    assert.equal(decodeEntities('I&amp;rsquo;ll'), 'I\u2019ll')
    assert.equal(decodeEntities('&#39;&#x27;'), '\'\'')
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
