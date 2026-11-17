const endpoint = process.env.APPSYNC_ENDPOINT || ''
const apiKey = process.env.APPSYNC_API_KEY || ''

export type ImportRequest = {
  requestId: string
  userId: string
  songId: string
  jamId: string
  title: string
  artist?: string | null
  status: string
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  if (!endpoint || !apiKey) throw new Error('Set APPSYNC_ENDPOINT and APPSYNC_API_KEY')
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ query, variables }),
  })
  const body = await res.json() as { data?: T, errors?: { message: string }[] }
  if (body.errors?.length) throw new Error(body.errors.map((error) => error.message).join('; '))
  if (!body.data) throw new Error('AppSync returned no data')
  return body.data
}

const listQuery = `query ListPendingImports($limit: Int) {
  listPendingImports(limit: $limit) {
    requestId userId songId jamId title artist status
  }
}`

const claimMutation = `mutation ClaimImport($requestId: ID!) {
  claimImport(requestId: $requestId) { requestId status }
}`

const completeMutation = `mutation CompleteImport($requestId: ID!, $chordSheet: String!, $sourceUrl: String!) {
  completeImport(requestId: $requestId, chordSheet: $chordSheet, sourceUrl: $sourceUrl) {
    requestId status chosenUrl
  }
}`

const failMutation = `mutation FailImport($requestId: ID!, $error: String!) {
  failImport(requestId: $requestId, error: $error) { requestId status error }
}`

export async function listPending(): Promise<ImportRequest[]> {
  const data = await gql<{ listPendingImports: ImportRequest[] }>(listQuery, { limit: 5 })
  return data.listPendingImports || []
}

export async function claim(requestId: string): Promise<boolean> {
  const data = await gql<{ claimImport: { requestId: string } | null }>(claimMutation, { requestId })
  return !!data.claimImport?.requestId
}

export async function complete(requestId: string, chordSheet: string, sourceUrl: string) {
  await gql(completeMutation, { requestId, chordSheet, sourceUrl })
}

export async function fail(requestId: string, error: string) {
  await gql(failMutation, { requestId, error })
}
