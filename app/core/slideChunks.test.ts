import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { chordSheetToSlides, clampSlideIndex, convertOslynSongToPages, slideChunkSizes } from './oslyn.ts'

describe('slideChunkSizes', () => {
  it('splits a section into even chunks of 2 or 3', () => {
    assert.deepEqual(slideChunkSizes(1), [1])
    assert.deepEqual(slideChunkSizes(2), [2])
    assert.deepEqual(slideChunkSizes(3), [3])
    assert.deepEqual(slideChunkSizes(4), [2, 2])
    assert.deepEqual(slideChunkSizes(5), [3, 2])
    assert.deepEqual(slideChunkSizes(6), [3, 3])
    assert.deepEqual(slideChunkSizes(7), [3, 2, 2])
    assert.deepEqual(slideChunkSizes(8), [3, 3, 2])
    assert.deepEqual(slideChunkSizes(10), [3, 3, 2, 2])
  })
})

describe('clampSlideIndex', () => {
  it('pulls a saved jam page back inside the slides that exist now', () => {
    assert.equal(clampSlideIndex(40, 10), 9)
    assert.equal(clampSlideIndex(-2, 10), 0)
    assert.equal(clampSlideIndex(3, 10), 3)
    assert.equal(clampSlideIndex(3, 0), 0)
    assert.equal(clampSlideIndex(Number.NaN, 4), 0)
  })
})

function line(section: string, lyric: string, phrase: number) {
  return { lyric, section, chords: [], phrase, phraseDuration: null, start: null }
}

describe('convertOslynSongToPages', () => {
  it('keeps each chunk inside one section', () => {
    const slides = convertOslynSongToPages({
      meta: {},
      song: [
        ...['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((lyric) => line('Verse 1', lyric, 0)),
        line('Chorus', 'sing', 1),
        line('Chorus', 'again', 2),
      ],
    } as any)
    assert.deepEqual(slides.pages.map((p) => p.lines.map((l) => l.lyric)), [
      ['a', 'b', 'c'],
      ['d', 'e'],
      ['f', 'g'],
      ['sing'],
      ['again'],
    ])
    assert.deepEqual(slides.pages.map((p) => p.lines[0].section), [
      'Verse 1', 'Verse 1', 'Verse 1', 'Chorus', 'Chorus',
    ])
    assert.equal(slides.pages[0].extra?.lyric, 'd')
  })

  it('returns no pages for an empty song', () => {
    assert.deepEqual(convertOslynSongToPages({ meta: {}, song: [] } as any).pages, [])
  })
})

describe('chordSheetToSlides', () => {
  it('shows 2-3 lyric lines per slide from a stored chart with blank rows', () => {
    const sheet = [
      '[Verse 1]',
      '',
      'D7          G',
      '',
      "Don't ask the other guys",
      '',
      'Em          C',
      "They wouldn't know",
      '',
      'G           D',
      'What you did last night',
      '',
      'C           G',
      'One more line',
      '',
      'Am          F',
      'And a fifth',
      '',
      'And here it goes',
      '',
      '[Chorus]',
      '',
      'C           G',
      'We all sing along',
      '',
      'Am          F',
      'Until the break of dawn',
      '',
      '[Bridge]',
      '',
      'Am',
      'Only this',
    ].join('\n')

    const slides = chordSheetToSlides(sheet, 'G')
    const lyrics = slides.pages.map((page) => page.lines.map((line) => line.lyric.trim()))
    assert.deepEqual(lyrics, [
      ["Don't ask the other guys", "They wouldn't know", "What you did last night"],
      ['One more line', 'And a fifth', 'And here it goes'],
      ['We all sing along', 'Until the break of dawn'],
      ['Only this'],
    ])
    assert.deepEqual(slides.pages.map((page) => page.lines[0].section), [
      'Verse 1', 'Verse 1', 'Chorus', 'Bridge',
    ])
    assert.equal(slides.pages[0].lines[0].chords.length, 2)
    assert.equal(slides.pages.every((page) => page.lines.length >= 1 && page.lines.length <= 3), true)
    assert.equal(slides.pages.every((page) => page.lines.every((line) => line.section === page.lines[0].section)), true)
  })
})
