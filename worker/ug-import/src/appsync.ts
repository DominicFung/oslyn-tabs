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

// AppSync forwards only the mutation selection set to subscribers.
// onImportStatusChanged asks for these fields; leaving any of them out
// makes that field null in the jam, and a missing jamId drops the event.
const importSelection = `
  requestId
  userId
  songId
  jamId
  title
  artist
  status
  chosenUrl
  error
  chordSheet
`

const claimMutation = `mutation ClaimImport($requestId: ID!) {
  claimImport(requestId: $requestId) { ${importSelection} }
}`

const completeMutation = `mutation CompleteImport($requestId: ID!, $chordSheet: String!, $sourceUrl: String!) {
  completeImport(requestId: $requestId, chordSheet: $chordSheet, sourceUrl: $sourceUrl) { ${importSelection} }
}`

const failMutation = `mutation FailImport($requestId: ID!, $error: String!) {
  failImport(requestId: $requestId, error: $error) { ${importSelection} }
}`

export async function listPending(): Promise<ImportRequest[]> {
  const data = await gql<{ listPendingImports: ImportRequest[] }>(listQuery, { limit: 5 })
  return data.listPendingImports || []
}

export async function claim(requestId: string): Promise<boolean> {
  const data = await gql<{ claimImport: { requestId: string } | null }>(claimMutation, { requestId })
  return !!data.claimImport?.requestId
}

export type ImportCompletion = {
  requestId?: string | null
  status?: string | null
} | null | undefined

/** A null payload is how AppSync reports a Lambda that returned nothing. */
export function completionFailure(result: ImportCompletion): string | null {
  if (!result?.requestId || result.status !== 'DONE') return 'completeImport returned no result'
  return null
}

export async function complete(requestId: string, chordSheet: string, sourceUrl: string) {
  const data = await gql<{ completeImport: ImportCompletion }>(completeMutation, { requestId, chordSheet, sourceUrl })
  const failure = completionFailure(data.completeImport)
  if (failure) throw new Error(failure)
}

export async function fail(requestId: string, error: string) {
  await gql(failMutation, { requestId, error })
}

/** Runs one claimed import. A thrown error, including a null completeImport, is failed. */
export async function settleImport(
  requestId: string,
  work: () => Promise<void>,
  failImport: (requestId: string, error: string) => Promise<unknown> = fail,
) {
  try {
    await work()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'import failed'
    console.error(message)
    await failImport(requestId, message).catch((failError) => console.error('failImport failed', failError))
  }
}
