export type ChordLineWidths = { line: number, chord: number }

export type LayoutEvent = {
  nativeEvent: { layout?: { width: number, height: number } | null } | null
}

export type TextLayoutEvent = {
  nativeEvent: { lines?: Array<{ width: number }> | null } | null
}

/** Copy the layout box before React Native nulls the synthetic event. */
export function layoutSize(event: LayoutEvent | null | undefined): { width: number, height: number } {
  const layout = event?.nativeEvent?.layout
  return {
    width: layout?.width || 0,
    height: layout?.height || 0,
  }
}

/** Copy the first text-line width before the synthetic event is released. */
export function textLayoutWidth(event: TextLayoutEvent | null | undefined): number {
  return event?.nativeEvent?.lines?.[0]?.width || 0
}

/**
 * Read the height now, then hand a plain number to the state updater.
 * The updater must not touch the event: it runs after the event is null.
 */
export function queueMeasuredHeight(
  event: LayoutEvent | null | undefined,
  setHeight: (update: (previous: number) => number) => void,
) {
  const height = layoutSize(event).height
  setHeight((previous) => acceptMeasuredWidth(previous, height))
}

/** The words drawn on a slide. The whole lyric, never cut down to an ellipsis. */
export function slideLyricText(lyric: string): string {
  return (lyric || '').trim()
}

/** Round a layout width. Zero and non-numbers are ignored so a later event can still fill it in. */
export function acceptMeasuredWidth(previous: number, measured: number): number {
  if (!Number.isFinite(measured) || measured <= 0) return previous
  const rounded = Math.round(measured)
  return rounded === previous ? previous : rounded
}

/**
 * Keep the same object when a layout event repeats the width we already stored.
 * Returning the previous object lets setState bail out instead of rendering again.
 */
export function acceptChordLineWidth(
  previous: ChordLineWidths,
  part: 'line' | 'chord',
  measured: number,
): ChordLineWidths {
  const current = part === 'line' ? previous.line : previous.chord
  const next = acceptMeasuredWidth(current, measured)
  if (next === current) return previous
  return part === 'line' ? { line: next, chord: previous.chord } : { line: previous.line, chord: next }
}

/**
 * Left edge of each chord. A chord-only row spaces by the gaps in the chord
 * line, so a trailing chord past the lyric still has its own slot. A lyric
 * line uses the characters before the chord, including columns past the text.
 */
export function chordOffsets(lyric: string, positions: number[], charWidth: number): number[] {
  const text = lyric ?? ''
  const step = Math.max(1, charWidth)
  const blank = text.trim() === ''
  const offsets: number[] = []
  for (let i = 0; i < positions.length; i++) {
    const at = Math.max(0, positions[i] || 0)
    if (blank) {
      const previous = i === 0 ? 0 : Math.max(0, positions[i - 1] || 0)
      const delta = i === 0 ? 0 : Math.max(1, at - previous)
      offsets.push((offsets[i - 1] || 0) + delta * step)
    } else {
      const prefix = at <= text.length ? at : text.length + (at - text.length)
      offsets.push(prefix * step)
    }
  }
  return offsets
}

/** How many commits a stream of layout events would cause. Used to prove the loop is closed. */
export function commitCount(events: Array<['line' | 'chord', number]>): number {
  let state: ChordLineWidths = { line: 0, chord: 0 }
  let commits = 0
  for (const [part, measured] of events) {
    const next = acceptChordLineWidth(state, part, measured)
    if (next !== state) {
      state = next
      commits += 1
    }
  }
  return commits
}
