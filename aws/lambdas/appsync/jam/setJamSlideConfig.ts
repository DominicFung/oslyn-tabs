import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, textSize: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.jamSessionId is empty`); return }
  if (!b.textSize) { console.error(`b.textSize is empty`); return }

  const dynamo = new DynamoDBClient({})
  console.log(`textSize: ${b.textSize}`)

  const params = updateDynamoUtil({ 
    table: JAM_TABLE_NAME, 
    key: { jamSessionId: b.jamSessionId },
    item: { slideTextSize: b.textSize } 
  })

  console.log(params)
  console.log("params calculated")
  const res1 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res1)

  return { jamSessionId: b.jamSessionId, textSize: b.textSize }
}