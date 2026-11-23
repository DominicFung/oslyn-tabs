import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { isImporterAdmin, type ImporterStatus } from '@/core/importerAdmin'
import { _Session } from '@/core/utils/frontend'
import secret from '@/secret.json'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

export const dynamic = 'force-dynamic'

const STATUS_QUERY = `query ImporterStatus {
  importerStatus { running desired pending lastStarted }
}`

const SET_MUTATION = `mutation SetImporterRunning($enabled: Boolean!) {
  setImporterRunning(enabled: $enabled) { running desired pending lastStarted }
}`

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email || ''
  if (!(session?.user as _Session | undefined)?.userId) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!isImporterAdmin(email)) {
    return { error: NextResponse.json({ error: 'Not authorized' }, { status: 403 }) }
  }
  return { email: email.trim().toLowerCase() }
}

async function appsync(email: string, query: string, variables?: Record<string, unknown>) {
  const signingKey = secret.nextauth?.NEXTAUTH_SECRET || ''
  const endpoint = amplifyconfig.aws_appsync_graphqlEndpoint
  const apiKey = amplifyconfig.aws_appsync_apiKey
  if (!signingKey || !endpoint || !apiKey) {
    return NextResponse.json({ error: 'Importer control is not configured' }, { status: 500 })
  }
  // Same message the Lambda verifies: oslyn-importer:<lowercase email>.
  const proof = createHmac('sha256', signingKey).update(`oslyn-importer:${email}`).digest('hex')
  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'x-importer-email': email,
        'x-importer-proof': proof,
      },
      body: JSON.stringify({ query, variables }),
    })
  } catch {
    return NextResponse.json({ error: 'Importer request failed' }, { status: 502 })
  }
  const body = await res.json().catch(() => null) as {
    data?: { importerStatus?: ImporterStatus, setImporterRunning?: ImporterStatus }
    errors?: { message?: string }[]
  } | null
  if (!res.ok || !body) {
    return NextResponse.json({ error: 'Importer request failed' }, { status: 502 })
  }
  if (body.errors?.length) {
    const message = body.errors.map((error) => error.message || 'Importer request failed').join('; ')
    const status = /not authorized/i.test(message) ? 403 : 502
    return NextResponse.json({ error: message }, { status })
  }
  const status = body.data?.importerStatus || body.data?.setImporterRunning
  if (!status) return NextResponse.json({ error: 'Importer request failed' }, { status: 502 })
  return NextResponse.json(status)
}

export async function GET(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const gate = await requireAdmin()
  if ('error' in gate) return gate.error
  return appsync(gate.email, STATUS_QUERY)
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const gate = await requireAdmin()
  if ('error' in gate) return gate.error
  const body = await request.json().catch(() => null) as { on?: unknown } | null
  if (!body || typeof body.enabled !== 'boolean') {
    return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 })
  }
  return appsync(gate.email, SET_MUTATION, { enabled: body.enabled })
}
