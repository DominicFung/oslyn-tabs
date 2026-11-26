import { createHmac } from 'crypto'
import type { ImporterStatus } from '@/core/importerAdmin'

const STATUS_QUERY = `query ImporterStatus {
  importerStatus { running desired pending lastStarted }
}`

const SET_MUTATION = `mutation SetImporterRunning($enabled: Boolean!) {
  setImporterRunning(enabled: $enabled) { running desired pending lastStarted }
}`

export { STATUS_QUERY, SET_MUTATION }

/** Same HMAC the importer Lambda checks. The secret never leaves the server. */
export async function importerAppsync(input: {
  email: string
  signingKey: string
  endpoint: string
  apiKey: string
  query: string
  variables?: Record<string, unknown>
}): Promise<{ status: number, body: ImporterStatus | { error: string } }> {
  const email = input.email.trim().toLowerCase()
  if (!input.signingKey || !input.endpoint || !input.apiKey) {
    return { status: 500, body: { error: 'Importer control is not configured' } }
  }
  const proof = createHmac('sha256', input.signingKey).update(`oslyn-importer:${email}`).digest('hex')
  let res: Response
  try {
    res = await fetch(input.endpoint, {
      method: 'POST',
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        'x-api-key': input.apiKey,
        'x-importer-email': email,
        'x-importer-proof': proof,
      },
      body: JSON.stringify({ query: input.query, variables: input.variables }),
    })
  } catch {
    return { status: 502, body: { error: 'Importer request failed' } }
  }
  const body = await res.json().catch(() => null) as {
    data?: { importerStatus?: ImporterStatus, setImporterRunning?: ImporterStatus }
    errors?: { message?: string }[]
  } | null
  if (!res.ok || !body) return { status: 502, body: { error: 'Importer request failed' } }
  if (body.errors?.length) {
    const message = body.errors.map((error) => error.message || 'Importer request failed').join('; ')
    const status = /not authorized/i.test(message) ? 403 : 502
    return { status, body: { error: message } }
  }
  const status = body.data?.importerStatus || body.data?.setImporterRunning
  if (!status) return { status: 502, body: { error: 'Importer request failed' } }
  return { status: 200, body: status }
}
