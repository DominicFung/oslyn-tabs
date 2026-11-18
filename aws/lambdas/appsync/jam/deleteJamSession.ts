import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { _JamSession } from '../../type'
import { deleteJamRoom } from '../setList/setCleanup'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

/** Host only. Deletes the room and its recordings and import requests. The set stays. */
export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, userId: string
}, null>) => {
  const b = event.arguments
  if (!b?.jamSessionId || !b.userId) { console.error('jamSessionId and userId are required'); return }
  const dynamo = new DynamoDBClient({})
  const res = await dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } },
  }))
  if (!res.Item) { console.error(`jam not found: ${b.jamSessionId}`); return }
  const jam = unmarshall(res.Item) as _JamSession
  if (jam.userId !== b.userId) {
    console.error(`user ${b.userId} is not the host of ${b.jamSessionId}`)
    return
  }
  await deleteJamRoom(dynamo, b.jamSessionId)
  return { jamSessionId: b.jamSessionId }
}
