import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  ownerId: string, name?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.ownerId) { console.error(`b.ownerId is empty`); return }

  const dynamo = new DynamoDBClient({})
  const bandId = uuidv4()

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.ownerId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: ownerId not found: ${b.ownerId}`); return }
  let band = { bandId, ownerId: b.ownerId } as any
  if (b.name) band.name = b.name

  const res1 = await dynamo.send(
    new PutItemCommand({
      TableName: BAND_TABLE_NAME,
      Item: marshall(band)
    })
  )

  console.log(res1)
  band.owner = unmarshall(res0.Item).userId

  return band
}