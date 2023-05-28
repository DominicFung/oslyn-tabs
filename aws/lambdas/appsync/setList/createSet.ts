import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  creatorId: string, bandId?: string, description?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.creatorId) { console.error(`b.ownerId is empty`); return }

  const dynamo = new DynamoDBClient({})
  const setListId = uuidv4()
  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.creatorId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: creatorId not found: ${b.creatorId}`); return }
  let setList = { setListId, description: "" } as any
  if (b.bandId) setList.bandId = b.bandId
  if (b.description) setList.description = b.description

  const res1 = await dynamo.send(new PutItemCommand({
    TableName: SETLIST_TABLE_NAME, Item: marshall(setList)
  }))
  console.log(res1)
  
  setList.songs = []
  setList.editors = []
  setList.creator = unmarshall(res0.Item)

  return setList
}