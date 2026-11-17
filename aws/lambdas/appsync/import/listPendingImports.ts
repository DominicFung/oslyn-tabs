import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { listPending } from './store'

export const handler = async (event: AppSyncResolverEvent<{ limit?: number | null }, null>) => {
  const limit = Math.min(20, Math.max(1, event.arguments?.limit || 5))
  const dynamo = new DynamoDBClient({})
  return listPending(dynamo, limit)
}
