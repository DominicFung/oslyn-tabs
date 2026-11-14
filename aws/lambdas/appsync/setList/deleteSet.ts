import { DeleteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { AppSyncResolverEvent } from 'aws-lambda'
import { endAndDeleteJam, jamsForSet, loadOwnedSet, removeSetFromBands } from './setCleanup'

const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

/**
 * Deletes a set owned by userId.
 * Ends and deletes jam rows that reference the set, drops the id from band setIds,
 * and deletes the set row. Songs are never deleted.
 */
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
  for (const jam of jams) {
    if (!jam.jamSessionId) continue
    await endAndDeleteJam(dynamo, jam.jamSessionId)
  }

  await removeSetFromBands(dynamo, b.setListId)

  await dynamo.send(new DeleteItemCommand({
    TableName: SETLIST_TABLE_NAME,
    Key: { setListId: { S: b.setListId } },
    ConditionExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': { S: b.userId } },
  }))

  return {
    setListId: b.setListId,
    deleted: true,
    jamsRemoved: jams.length,
  }
}
