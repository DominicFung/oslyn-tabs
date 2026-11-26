import { createPublicKey, createVerify, type JsonWebKey } from 'crypto'

export type VerifiedIdentity = {
  provider: 'google' | 'apple'
  subject: string
  email: string
  name?: string
  givenName?: string
  familyName?: string
  picture?: string
}

export type IdentityFailure = { error: string }

const GOOGLE_ISSUERS = new Set(['accounts.google.com', 'https://accounts.google.com'])

export function googleIdentityFromTokenInfo(
  body: Record<string, unknown>,
  audiences: string[]
): VerifiedIdentity | IdentityFailure {
  const aud = stringClaim(body.aud)
  const azp = stringClaim(body.azp)
  const allowed = new Set(audiences.map((item) => item.trim()).filter(Boolean))
  if (!allowed.size || (!allowed.has(aud) && !allowed.has(azp))) {
    return { error: 'Google token was not issued for this app' }
  }
  const iss = stringClaim(body.iss)
  if (iss && !GOOGLE_ISSUERS.has(iss)) return { error: 'Google token issuer is not Google' }
  if (!truthy(body.email_verified)) return { error: 'Google email is not verified' }
  const email = stringClaim(body.email).toLowerCase()
  const subject = stringClaim(body.sub)
  if (!email || !email.includes('@') || !subject) return { error: 'Google token is missing an email' }
  return {
    provider: 'google',
    subject,
    email,
    name: stringClaim(body.name) || undefined,
    givenName: stringClaim(body.given_name) || undefined,
    familyName: stringClaim(body.family_name) || undefined,
    picture: stringClaim(body.picture) || undefined,
  }
}

export async function verifyGoogleIdToken(idToken: string, audiences: string[]): Promise<VerifiedIdentity | IdentityFailure> {
  if (!idToken || idToken.length > 8000) return { error: 'Google token is missing' }
  let res: Response
  try {
    res = await fetch('https://oauth2.googleapis.com/tokeninfo', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ id_token: idToken }),
      cache: 'no-store',
    })
  } catch {
    return { error: 'Could not reach Google to verify the sign-in' }
  }
  const body = await res.json().catch(() => null) as Record<string, unknown> | null
  if (!res.ok || !body) return { error: 'Google rejected the sign-in' }
  if (typeof body.error === 'string' || typeof body.error_description === 'string') {
    return { error: 'Google rejected the sign-in' }
  }
  return googleIdentityFromTokenInfo(body, audiences)
}

type AppleKey = JsonWebKey & { kid?: string }

export function appleIdentityFromClaims(
  payload: Record<string, unknown>,
  audiences: string[],
  now = Date.now()
): VerifiedIdentity | IdentityFailure {
  if (stringClaim(payload.iss) !== 'https://appleid.apple.com') return { error: 'Apple token issuer is not Apple' }
  const aud = stringClaim(payload.aud)
  const allowed = new Set(audiences.map((item) => item.trim()).filter(Boolean))
  if (!allowed.size || !allowed.has(aud)) return { error: 'Apple token was not issued for this app' }
  const exp = typeof payload.exp === 'number' ? payload.exp : Number(payload.exp)
  if (!Number.isFinite(exp) || exp * 1000 <= now) return { error: 'Apple sign-in expired' }
  const subject = stringClaim(payload.sub)
  if (!subject) return { error: 'Apple token is missing a subject' }
  const email = stringClaim(payload.email).toLowerCase()
  if (!email || !email.includes('@')) {
    return { error: 'Apple did not include an email. In Settings, stop using Sign in with Apple for Oslyn, then try again and share your email.' }
  }
  if (payload.email_verified != null && !truthy(payload.email_verified)) {
    return { error: 'Apple email is not verified' }
  }
  return { provider: 'apple', subject, email }
}

export function verifyAppleIdentityToken(
  idToken: string,
  keys: AppleKey[],
  audiences: string[],
  now = Date.now()
): VerifiedIdentity | IdentityFailure {
  const parts = idToken.split('.')
  if (parts.length !== 3) return { error: 'Apple token is malformed' }
  let header: Record<string, unknown>
  let payload: Record<string, unknown>
  try {
    header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'))
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
  } catch {
    return { error: 'Apple token is malformed' }
  }
  if (header.alg !== 'RS256') return { error: 'Apple token is not RS256' }
  const kid = stringClaim(header.kid)
  const jwk = keys.find((key) => key.kid === kid && key.kty === 'RSA')
  if (!jwk) return { error: 'Apple signing key was not found' }
  const signature = Buffer.from(parts[2], 'base64url')
  let ok = false
  try {
    const key = createPublicKey({ key: jwk, format: 'jwk' })
    ok = createVerify('RSA-SHA256').update(`${parts[0]}.${parts[1]}`).verify(key, signature)
  } catch {
    ok = false
  }
  if (!ok) return { error: 'Apple token signature is invalid' }
  return appleIdentityFromClaims(payload, audiences, now)
}

let appleKeys: { at: number, keys: AppleKey[] } | null = null

export async function fetchAppleKeys(now = Date.now()): Promise<AppleKey[] | IdentityFailure> {
  if (appleKeys && now - appleKeys.at < 60 * 60 * 1000) return appleKeys.keys
  let res: Response
  try {
    res = await fetch('https://appleid.apple.com/auth/keys', { cache: 'no-store' })
  } catch {
    return { error: 'Could not reach Apple to verify the sign-in' }
  }
  const body = await res.json().catch(() => null) as { keys?: AppleKey[] } | null
  if (!res.ok || !body?.keys?.length) return { error: 'Apple did not publish signing keys' }
  appleKeys = { at: now, keys: body.keys }
  return body.keys
}

function stringClaim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function truthy(value: unknown): boolean {
  return value === true || value === 'true'
}
