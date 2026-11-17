import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { setImportStatus } from './store'

export const handler = async (event: AppSyncResolverEvent<{ requestId: string }, null>) => {
  const requestId = event.arguments?.requestId
  if (!requestId) { console.error('requestId is required'); return }
  const dynamo = new DynamoDBClient({})
  const claimed = await setImportStatus(dynamo, requestId, 'IMPORTING', {}, 'PENDING')
  if (!claimed) { console.error(`could not claim ${requestId}`); return }
  return claimed
}
