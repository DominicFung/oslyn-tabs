/** "Nov 14, 2026 Jam". Same title the website uses for Start Jam. */
export function jamTitle(timeZone?: string, now = new Date()): string {
  let zone = 'UTC'
  if (timeZone && timeZone.length > 0 && timeZone.length <= 80) {
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
