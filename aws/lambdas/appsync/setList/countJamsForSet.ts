import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { AppSyncResolverEvent } from 'aws-lambda'
import { jamsForSet, loadOwnedSet } from './setCleanup'

export const handler = async (event: AppSyncResolverEvent<{
  setListId: string, userId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b?.setListId || !b?.userId) { console.error('setListId and userId are required'); return }

  const dynamo = new DynamoDBClient({})
  const setList = await loadOwnedSet(dynamo, b.setListId, b.userId)
  if (!setList) {
    console.error(`unauthorized or missing set ${b.setListId} for ${b.userId}`)
    throw new Error('unauthorized')
  }

  const jams = await jamsForSet(dynamo, b.setListId)
  return jams.length
}
