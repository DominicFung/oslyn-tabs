export type ThemeMode = 'light' | 'dark' | 'system'
export type Scheme = 'light' | 'dark'

/**
 * Active appearance from the in-app setting. System follows the device.
 * An explicit light or dark choice wins over the device.
 */
export function resolveScheme(mode: ThemeMode, system: string | null | undefined): Scheme {
  if (mode === 'light' || mode === 'dark') return mode
  return system === 'dark' ? 'dark' : 'light'
}

/**
 * Page wash behind every screen.
 * Light matches the website `from-coral-50 to-oslyn-200`.
 * Dark matches `dark:from-oslyn-900 dark:to-black` (#2a1a4a → #000).
 */
export function screenGradient(scheme: Scheme): [string, string] {
  if (scheme === 'dark') return ['#2a1a4a', '#000000']
  return ['#e4bcbb', '#bb9bff']
}

/** Lyric ink. Light is oslyn-700 / gray-700. Dark is oslyn-200 / gray-400, same as the website. */
export function lyricInk(scheme: Scheme, secondary = false): string {
  if (secondary) return scheme === 'dark' ? '#9ca3af' : '#374151'
  return scheme === 'dark' ? '#bb9bff' : '#5f28d4'
}

/** Jam header title. Light stays gray-600. */
export function jamTitleInk(scheme: Scheme): string {
  return scheme === 'dark' ? '#f9fafb' : '#4b5563'
}

/** Section label above a lyric line. Light stays gray-500. */
export function jamSectionInk(scheme: Scheme): string {
  return scheme === 'dark' ? '#d1d5db' : '#6b7280'
}

/** Close mark on the jam header. Light stays oslyn purple. */
export function jamIconInk(scheme: Scheme): string {
  return scheme === 'dark' ? '#e7ddff' : '#4c1d95'
}
