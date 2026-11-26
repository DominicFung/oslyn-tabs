import { NextResponse } from 'next/server'

import amplifyconfig from '@/../src/amplifyconfiguration.json'
import { isImporterAdmin } from '@/core/importerAdmin'
import { importerAppsync, SET_MUTATION, STATUS_QUERY } from '@/core/importerAppsync'
import { mobileAuthConfig } from '@/core/mobileAuthConfig'
import { bearerToken, readMobileSession } from '@/core/mobileSession'

export const dynamic = 'force-dynamic'

/**
 * Same importer switch as /api/profile/importer.
 * The phone proves who it is with the session from /api/auth/mobile.
 * This route adds the HMAC. The app never sees the secret.
 */
async function requireAdmin(request: Request) {
  const config = mobileAuthConfig()
  const session = readMobileSession(config.nextAuthSecret, bearerToken(request.headers.get('authorization')))
  if (!session) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!isImporterAdmin(session.email)) return { error: NextResponse.json({ error: 'Not authorized' }, { status: 403 }) }
  return { email: session.email.trim().toLowerCase(), config }
}

export async function GET(request: Request) {
  const gate = await requireAdmin(request)
  if ('error' in gate) return gate.error
  const result = await importerAppsync({
    email: gate.email,
    signingKey: gate.config.nextAuthSecret,
    endpoint: amplifyconfig.aws_appsync_graphqlEndpoint,
    apiKey: amplifyconfig.aws_appsync_apiKey,
    query: STATUS_QUERY,
  })
  return NextResponse.json(result.body, { status: result.status })
}

export async function POST(request: Request) {
  const gate = await requireAdmin(request)
  if ('error' in gate) return gate.error
  const body = await request.json().catch(() => null) as { enabled?: unknown } | null
  if (!body || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 })
  }
  const result = await importerAppsync({
    email: gate.email,
    signingKey: gate.config.nextAuthSecret,
    endpoint: amplifyconfig.aws_appsync_graphqlEndpoint,
    apiKey: amplifyconfig.aws_appsync_apiKey,
    query: SET_MUTATION,
    variables: { enabled: body.enabled },
  })
  return NextResponse.json(result.body, { status: result.status })
}
