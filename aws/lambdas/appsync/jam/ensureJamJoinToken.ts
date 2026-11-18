import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { randomUUID } from 'crypto'
import { _JamSession } from '../../type'
import { canEditJamSongs } from '../../util/jamAccess'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

/** Host and admins can read or create the share token. Other callers get nothing. */
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
  if (!canEditJamSongs(jam, b.userId)) {
    console.error(`user ${b.userId} cannot share ${b.jamSessionId}`)
    return
  }
  let joinToken = jam.joinToken
  if (!joinToken) {
    joinToken = randomUUID()
    await dynamo.send(new UpdateItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } },
      UpdateExpression: 'SET joinToken = :token',
      ExpressionAttributeValues: { ':token': { S: joinToken } },
    }))
  }
  return { jamSessionId: b.jamSessionId, joinToken }
}
