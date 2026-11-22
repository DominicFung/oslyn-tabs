const CLOSED = /has been closed|target closed|browser has been closed|sigterm/i

/** True for the Playwright error a restart leaves when it closes the browser mid-import. */
export function browserClosed(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || '')
  return CLOSED.test(message)
}

/**
 * A stop signal should put the claim back to PENDING instead of failing it.
 * All Too Well was failed with "Target page, context or browser has been closed"
 * when the worker was restarted mid-fetch.
 */
export function shutdownAction(stopping: boolean, error: unknown): 'release' | 'fail' {
  if (stopping) return 'release'
  if (browserClosed(error)) return 'release'
  return 'fail'
}
