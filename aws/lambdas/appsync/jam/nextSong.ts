import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, song: number, page?: number
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.creatorId is empty`); return }

  const dynamo = new DynamoDBClient({})
  console.log(`song: ${b.song}`)

  const params = updateDynamoUtil({ 
    table: JAM_TABLE_NAME, 
    key: { jamSessionId: b.jamSessionId },
    item: { currentSong: b.song, currentPage: b.page || 0 } 
  })

  console.log(params)
  console.log("params calculated")
  const res1 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res1)

  return { jamSessionId: b.jamSessionId, song: b.song, currentPage: b.page || 0 }
}