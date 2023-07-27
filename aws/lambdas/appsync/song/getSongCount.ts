import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, addSharedCount: boolean
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new QueryCommand({
      TableName: SONG_TABLE_NAME,
      IndexName: "userId",
      KeyConditionExpression: "userId = :key",
      ExpressionAttributeValues: { ":key": { S: b.userId } },
      Select: "COUNT"
    })
  )
  console.log(res0)

  if (b.addSharedCount) {
    console.log("TODO: addSharedCount")
  }

  return res0.Count || 0
}