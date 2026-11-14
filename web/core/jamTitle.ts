/** "Nov 14, 2026 Jam". Falls back to UTC when the browser zone is missing or invalid. */
export function jamTitle(timeZone?: unknown, now = new Date()): string {
  let zone = 'UTC'
  if (typeof timeZone === 'string' && timeZone.length > 0 && timeZone.length <= 80) {
    try {
      Intl.DateTimeFormat('en-US', { timeZone }).format(now)
      zone = timeZone
    } catch {
      zone = 'UTC'
    }
  }
  const date = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: zone,
  }).format(now)
  return `${date} Jam`
}
