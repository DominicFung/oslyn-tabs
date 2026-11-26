import { readFileSync } from 'fs'
import { join } from 'path'

type SecretFile = {
  nextauth?: {
    NEXTAUTH_SECRET?: string
    google?: { GOOGLE_CLIENT_ID?: string }
  }
}

/** Client IDs are public. The NextAuth secret is not, and it stays on the server. */
export function mobileAuthConfig() {
  const secret = readSecret()
  const googleAudiences = unique([
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
    process.env.GOOGLE_WEB_CLIENT_ID,
    secret.nextauth?.google?.GOOGLE_CLIENT_ID,
  ])
  const configuredApple = (process.env.APPLE_BUNDLE_ID || '').trim()
  const appleAudiences = configuredApple ? [configuredApple] : ['TJR9Q2Q4KU.com.oslyn.tabs']
  const nextAuthSecret = process.env.NEXTAUTH_SECRET || secret.nextauth?.NEXTAUTH_SECRET || ''
  return { googleAudiences, appleAudiences, nextAuthSecret }
}

function readSecret(): SecretFile {
  try {
    const raw = readFileSync(join(process.cwd(), 'secret.json'), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as SecretFile
  } catch {
    return {}
  }
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.map((value) => (value || '').trim()).filter(Boolean)))
}
