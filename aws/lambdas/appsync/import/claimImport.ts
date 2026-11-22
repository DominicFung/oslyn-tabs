import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { getImport, isStaleImporting, setImportStatus } from './store'

export const handler = async (event: AppSyncResolverEvent<{ requestId: string }, null>) => {
  const requestId = event.arguments?.requestId
  if (!requestId) { console.error('requestId is required'); return }
  const dynamo = new DynamoDBClient({})
  const current = await getImport(dynamo, requestId)
  if (!current) { console.error(`could not claim ${requestId}`); return }
  const reclaim = isStaleImporting(current.status, current.updatedAt, Date.now())
  if (current.status !== 'PENDING' && !reclaim) {
    console.error(`could not claim ${requestId}: ${current.status}`)
    return
  }
  const claimed = await setImportStatus(dynamo, requestId, 'IMPORTING', {}, current.status, current.updatedAt)
  if (!claimed) { console.error(`could not claim ${requestId}`); return }
  return claimed
}
