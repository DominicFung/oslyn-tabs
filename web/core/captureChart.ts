// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import { chordSheetToSlides, getChordByNumber } from './oslyn.ts'
// @ts-expect-error TS5097
import { chordTemplate, semitonesBetween, sequenceFromSlides, transposeSymbol, type FollowChord, type FollowChartChord, type FollowPageLayout } from './follow.ts'

export type CapturedChart = {
  chords: FollowChord[]
  pages: FollowPageLayout[]
}

/** Chart layout stored on a recording. The same pages the jam shows, without starting the follower. */
export function captureChart(chordSheet: string, chartKey: string, songKey: string): CapturedChart {
  const writtenKey = chartKey || songKey || 'C'
  const sounding = songKey || writtenKey
  const slides = chordSheetToSlides(chordSheet || '', writtenKey)
  const written = sequenceFromSlides(slides, writtenKey, getChordByNumber)
  const shift = semitonesBetween(writtenKey, sounding)
  const chords = written.map((chord) => {
    const symbol = transposeSymbol(chord.symbol, shift)
    const template = chordTemplate(symbol) || chord.template
    return { ...chord, symbol, template }
  })
  return {
    chords,
    pages: (slides.pages || []).map((page, index) => ({
      page: index,
      lines: page.lines.map((line) => line.lyric || line.section || ''),
    })),
  }
}

export function chartSymbols(chords: FollowChord[]): FollowChartChord[] {
  return chords.map(({ symbol, page, line }) => ({ symbol, page, line }))
}
