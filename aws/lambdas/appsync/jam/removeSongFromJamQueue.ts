import { AppSyncResolverEvent } from 'aws-lambda'
import { GetItemCommand, DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'
import { _JamSession, _SetList } from '../../type'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, queueIndex: number
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.jamSessionId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const r0 = dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } }
  }))

  const res0 = (await (r0))?.Item
  if (!res0) { console.error(`Jam not found: ${b.jamSessionId}`); return }

  const jam = unmarshall(res0) as _JamSession
  console.log(JSON.stringify(jam, null, 2))
  let queue = jam.queue || []

  if (b.queueIndex < 0 || b.queueIndex >= queue.length) {
    console.error(`song at index: ${b.queueIndex} not found`); return 
  }
  
  queue.splice(b.queueIndex, 1)
  const res2 = dynamo.send(new UpdateItemCommand(
      updateDynamoUtil({
        table: JAM_TABLE_NAME,
        key: { jamSessionId: jam.jamSessionId },
        item: { queue }
      })
    ))
    console.log(res2)

  return { jamSessionId: b.jamSessionId, queue }
}