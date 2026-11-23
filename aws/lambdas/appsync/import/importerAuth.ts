import { createHmac, timingSafeEqual } from 'crypto'

/** Only this Google account may read or change the importer. */
export const IMPORTER_ADMIN_EMAIL = 'mission.possibleforsure@gmail.com'

export type ImporterStatus = {
  running: number
  desired: number
  pending: number
  lastStarted: number | null
}

export function countsFromService(service: {
  runningCount?: number
  desiredCount?: number
  pendingCount?: number
} | null | undefined) {
  return {
    running: service?.runningCount ?? 0,
    desired: service?.desiredCount ?? 0,
    pending: service?.pendingCount ?? 0,
  }
}

/** Unix seconds. ECS startedAt is a Date. */
export function latestStartedAt(tasks: Array<{ startedAt?: Date | string | number | null }>): number | null {
  let latest = 0
  for (const task of tasks) {
    const value = task.startedAt
    if (value == null || value === '') continue
    const ms = value instanceof Date
      ? value.getTime()
      : typeof value === 'number'
        ? (value < 10_000_000_000 ? value * 1000 : value)
        : Date.parse(value)
    if (Number.isFinite(ms) && ms > latest) latest = ms
  }
  return latest ? Math.floor(latest / 1000) : null
}

export function nextAuthSecretFromJson(raw: string): string {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return ''
  }
  if (!parsed || typeof parsed !== 'object') return ''
  const secret = (parsed as { nextauth?: { NEXTAUTH_SECRET?: unknown } }).nextauth?.NEXTAUTH_SECRET
  return typeof secret === 'string' ? secret : ''
}

export function emailFromIdentity(identity: unknown): string {
  if (!identity || typeof identity !== 'object') return ''
  const claims = (identity as { claims?: unknown }).claims
  if (!claims || typeof claims !== 'object') return ''
  const email = (claims as { email?: unknown }).email
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

export function headerValue(headers: Record<string, string | undefined> | null | undefined, name: string): string {
  if (!headers) return ''
  const want = name.toLowerCase()
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === want && typeof value === 'string') return value.trim()
  }
  return ''
}

/** HMAC input. The Next route and this Lambda must stay on this exact string. */
export function importerProofMessage(email: string) {
  return `oslyn-importer:${email.trim().toLowerCase()}`
}

export function importerProof(secret: string, email: string) {
  return createHmac('sha256', secret).update(importerProofMessage(email)).digest('hex')
}

function proofsMatch(expectedHex: string, provided: string) {
  const left = Buffer.from(expectedHex)
  const right = Buffer.from(provided)
  if (left.length === 0 || left.length !== right.length) return false
  return timingSafeEqual(left, right)
}

/**
 * AppSync's default auth is an API key, which is not a person.
 * A Cognito-style identity email is trusted.
 * An API-key call is trusted only when it carries an HMAC of the admin email
 * made with nextauth.NEXTAUTH_SECRET (the Next server has it; the browser does not).
 */
export function verifyImporterCaller(input: {
  identity: unknown
  headers?: Record<string, string | undefined> | null
  secret: string
}): { ok: true } | { ok: false } {
  const identityEmail = emailFromIdentity(input.identity)
  const headerEmail = headerValue(input.headers, 'x-importer-email').toLowerCase()
  if (identityEmail && identityEmail !== IMPORTER_ADMIN_EMAIL) return { ok: false }
  const email = identityEmail || headerEmail
  if (email !== IMPORTER_ADMIN_EMAIL) return { ok: false }
  if (identityEmail === IMPORTER_ADMIN_EMAIL) return { ok: true }
  if (!input.secret) return { ok: false }
  const proof = headerValue(input.headers, 'x-importer-proof')
  if (!proofsMatch(importerProof(input.secret, email), proof)) return { ok: false }
  return { ok: true }
}
