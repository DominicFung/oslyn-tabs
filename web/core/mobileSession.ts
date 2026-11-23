import { createHmac, timingSafeEqual } from 'crypto'

/** 30 days. The phone sends this back to routes that must know who verified. */
export const MOBILE_SESSION_MS = 30 * 24 * 60 * 60 * 1000

export type MobileSession = {
  userId: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  imageUrl?: string
  exp: number
}

export function issueMobileSession(secret: string, session: Omit<MobileSession, 'exp'>, now = Date.now()): string {
  if (!secret) throw new Error('session secret is empty')
  const payload = Buffer.from(JSON.stringify({ ...session, exp: now + MOBILE_SESSION_MS })).toString('base64url')
  const sig = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function readMobileSession(secret: string, token: string, now = Date.now()): MobileSession | null {
  if (!secret || !token) return null
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [payload, sig] = parts
  if (!payload || !sig) return null
  const expected = createHmac('sha256', secret).update(payload).digest('base64url')
  const left = Buffer.from(sig)
  const right = Buffer.from(expected)
  if (left.length === 0 || left.length !== right.length || !timingSafeEqual(left, right)) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!parsed || typeof parsed !== 'object') return null
  const row = parsed as Partial<MobileSession>
  if (!row.userId || !row.email || !row.username || typeof row.exp !== 'number') return null
  if (row.exp <= now) return null
  return {
    userId: row.userId,
    email: row.email,
    username: row.username,
    firstName: row.firstName,
    lastName: row.lastName,
    imageUrl: row.imageUrl,
    exp: row.exp,
  }
}

export function bearerToken(header: string | null): string {
  if (!header) return ''
  const match = header.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] || ''
}
