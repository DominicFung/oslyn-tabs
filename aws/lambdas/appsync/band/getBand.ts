import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  bandId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.bandId) { console.error(`b.bandId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: BAND_TABLE_NAME,
      Key: { bandId: { S: b.bandId } }
    })
  )

  if (res0.Item) return unmarshall(res0.Item)
  else {
    console.error(`ERROR: bandId not found: ${b.bandId}`)
    return
  }
}