export const IMPORTER_ADMIN_EMAIL = 'mission.possibleforsure@gmail.com'

export type ImporterStatus = {
  running: number
  desired: number
  pending: number
  lastStarted: number | null
}

export type ImporterBadge = 'Running' | 'Starting' | 'Stopped'

export function isImporterAdmin(email: string | null | undefined) {
  return (email || '').trim().toLowerCase() === IMPORTER_ADMIN_EMAIL
}

export function importerBadge(status: Pick<ImporterStatus, 'running' | 'desired' | 'pending'>): ImporterBadge {
  if (status.running > 0) return 'Running'
  if (status.desired > 0 || status.pending > 0) return 'Starting'
  return 'Stopped'
}

export function importerIsOn(status: Pick<ImporterStatus, 'running' | 'desired' | 'pending'>) {
  return status.desired > 0 || status.running > 0 || status.pending > 0
}
