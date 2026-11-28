export const UPDATE_DISMISS_KEY = 'oslyn-sw-dismissed'

/** The running page plus the worker script. A later deploy changes the page id. */
export function updateBuildId(pageSha: string | undefined, scriptUrl?: string): string {
  return `${pageSha || 'unknown'}:${scriptUrl || 'sw'}`
}

export function isUpdateDismissed(buildId: string, stored: string | null): boolean {
  return stored != null && stored === buildId
}
