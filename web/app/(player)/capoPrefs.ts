/** Same frets as CAPO_VALUES in sessionSteps.ts. The test checks they stay equal. */
export const CAPO_FRETS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'] as const

export type CapoPrefs = { default: string, bySong: Record<string, string> }

const EMPTY: CapoPrefs = { default: '0', bySong: {} }

function valid(value: unknown): value is string {
  return typeof value === 'string' && (CAPO_FRETS as readonly string[]).includes(value)
}

/** `jam/capo` JSON, or a legacy plain capo string used as the default. */
export function parseCapoPrefs(raw: string | null): CapoPrefs {
  if (!raw) return { ...EMPTY, bySong: {} }
  const trimmed = raw.trim()
  if (!trimmed.startsWith('{') && !trimmed.startsWith('"') && valid(trimmed)) {
    return { default: trimmed, bySong: {} }
  }
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (valid(parsed)) return { default: parsed, bySong: {} }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...EMPTY, bySong: {} }
    const record = parsed as { default?: unknown, bySong?: unknown }
    const bySong: Record<string, string> = {}
    if (record.bySong && typeof record.bySong === 'object' && !Array.isArray(record.bySong)) {
      for (const [id, value] of Object.entries(record.bySong as Record<string, unknown>)) {
        if (valid(value)) bySong[id] = value
      }
    }
    return { default: valid(record.default) ? record.default : '0', bySong }
  } catch {
    return valid(trimmed) ? { default: trimmed, bySong: {} } : { ...EMPTY, bySong: {} }
  }
}

export function capoForSong(prefs: CapoPrefs, songId: string | undefined): string {
  if (songId && valid(prefs.bySong[songId])) return prefs.bySong[songId]
  return valid(prefs.default) ? prefs.default : '0'
}

export function withSongCapo(prefs: CapoPrefs, songId: string | undefined, capo: string): CapoPrefs {
  if (!valid(capo)) return prefs
  const bySong = { ...prefs.bySong }
  if (songId) bySong[songId] = capo
  return { default: capo, bySong }
}
