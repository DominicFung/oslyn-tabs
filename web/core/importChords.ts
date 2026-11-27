// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import { chordSheetToSlides, getChordByNumber } from './oslyn.ts'

export type ImportedKeyChoice = {
  /** Written chart key. Chords are parsed in this key. */
  chordSheetKey: string
  /** Key menu value. Chords are named in this key. */
  jamKey: string
}

/**
 * The chart key is the key the imported sheet was written in.
 * A jam slot still on the empty-chart placeholder moves to that key.
 * A key the player already chose stays, and the sheet transposes to it.
 */
export function resolveImportedKeys(input: {
  slotKey?: string | null
  previousChartKey?: string | null
  previousChart?: string | null
  chordSheet: string
  detectedKey?: string | null
  refetchedKey?: string | null
  userChoseKey?: boolean
  detect?: (sheet: string) => string | null
}): ImportedKeyChoice {
  const previous = (input.previousChartKey || '').trim()
  const slot = (input.slotKey || '').trim() || 'C'
  const fromEvent = (input.detectedKey || '').trim()
  const fromSong = (input.refetchedKey || '').trim()
  const heard = (input.detect?.(input.chordSheet) || '').trim()
  const songKeyIsNew = !!fromSong && fromSong !== previous
  const detected = fromEvent || (songKeyIsNew ? fromSong : '') || heard || fromSong || previous || 'C'
  const chartWasEmpty = !(input.previousChart || '').trim()
  const placeholderSlot = chartWasEmpty && (!(input.slotKey || '').trim() || !previous || slot === previous)
  const jamKey = !input.userChoseKey && placeholderSlot ? detected : slot
  return { chordSheetKey: detected, jamKey }
}

/** Same naming the jam slide uses: parse in the chart key, spell in the key menu's key. */
export function displayedChords(sheet: string, chartKey: string, jamKey: string): string[] {
  const slides = chordSheetToSlides(sheet, chartKey)
  const names: string[] = []
  for (const page of slides.pages) {
    for (const line of page.lines) {
      for (const chord of line.chords || []) {
        const name = getChordByNumber(chord.chord, chord.isMinor, jamKey)
        if (name) names.push(`${name}${chord.decorator || ''}`)
      }
    }
  }
  return names
}
