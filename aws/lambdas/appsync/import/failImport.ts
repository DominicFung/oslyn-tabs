import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getImport, setImportStatus } from './store'

export const handler = async (event: AppSyncResolverEvent<{ requestId: string, error: string }, null>) => {
  const b = event.arguments
  if (!b?.requestId || !b.error?.trim()) { console.error('requestId and error are required'); return }
  const dynamo = new DynamoDBClient({})
  const saved = await setImportStatus(dynamo, b.requestId, 'FAILED', { error: b.error.trim().slice(0, 500) })
  if (!saved) return
  return getImport(dynamo, b.requestId)
}
