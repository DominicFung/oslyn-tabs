import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { setImportStatus } from './store'

/** Puts an in-flight claim back to PENDING. A finished or failed import is left alone. */
export const handler = async (event: AppSyncResolverEvent<{ requestId: string }, null>) => {
  const requestId = event.arguments?.requestId
  if (!requestId) { console.error('requestId is required'); return }
  const dynamo = new DynamoDBClient({})
  const released = await setImportStatus(dynamo, requestId, 'PENDING', {}, 'IMPORTING')
  if (!released) { console.error(`could not release ${requestId}`); return }
  return released
}
