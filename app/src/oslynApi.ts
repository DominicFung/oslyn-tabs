import { Account } from './session'

export type ImporterStatus = {
  running: number
  desired: number
  pending: number
  lastStarted: number | null
}

export function oslynApiUrl() {
  return (process.env.EXPO_PUBLIC_OSLYN_API_URL || 'https://tabs.oslyn.io').replace(/\/$/, '')
}

export async function exchangeIdentity(input: {
  provider: 'google' | 'apple'
  idToken: string
  name?: string
}): Promise<Account> {
  const res = await fetch(`${oslynApiUrl()}/api/auth/mobile`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ provider: input.provider, idToken: input.idToken, name: input.name }),
  })
  const body = await res.json().catch(() => ({})) as Partial<Account> & { error?: string }
  if (!res.ok || !body.sessionToken || !body.userId || !body.email) {
    throw new Error(body.error || 'Could not sign in')
  }
  return {
    userId: body.userId,
    email: body.email,
    username: body.username || 'Oslyn',
    firstName: body.firstName,
    lastName: body.lastName,
    imageUrl: body.imageUrl,
    sessionToken: body.sessionToken,
  }
}

export async function readImporter(sessionToken: string): Promise<ImporterStatus> {
  return importerRequest(sessionToken, 'GET')
}

export async function writeImporter(sessionToken: string, enabled: boolean): Promise<ImporterStatus> {
  return importerRequest(sessionToken, 'POST', { enabled })
}

async function importerRequest(sessionToken: string, method: 'GET' | 'POST', body?: { enabled: boolean }): Promise<ImporterStatus> {
  const res = await fetch(`${oslynApiUrl()}/api/profile/importer/mobile`, {
    method,
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${sessionToken}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const payload = await res.json().catch(() => ({})) as ImporterStatus & { error?: string }
  if (!res.ok || typeof payload.running !== 'number') {
    throw new Error(payload.error || 'Could not reach the importer')
  }
  return {
    running: payload.running,
    desired: payload.desired,
    pending: payload.pending,
    lastStarted: payload.lastStarted,
  }
}
