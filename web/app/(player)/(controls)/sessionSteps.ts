export const SONG_KEYS = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab'] as const

export const CAPO_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] as const

const CAPO_MIN = 0
const CAPO_MAX = CAPO_VALUES.length - 1

/** One step around the key dropdown, using that list's spelling. */
export function stepKey(current: string, direction: -1 | 1): string {
  const index = SONG_KEYS.indexOf(current as (typeof SONG_KEYS)[number])
  const start = index < 0 ? (direction < 0 ? 0 : -1) : index
  return SONG_KEYS[(start + direction + SONG_KEYS.length) % SONG_KEYS.length]
}

/** One fret within the capo dropdown. Stays on 0 and on the top fret. */
export function stepCapo(current: string, direction: -1 | 1): string {
  const parsed = Number.parseInt(current, 10)
  const base = Number.isFinite(parsed) ? parsed : CAPO_MIN
  const next = Math.min(CAPO_MAX, Math.max(CAPO_MIN, base + direction))
  return String(next)
}
