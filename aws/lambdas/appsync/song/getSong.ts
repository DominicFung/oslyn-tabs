import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring } from '../../util/dynamo'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  songId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.songId) { console.error(`b.songId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: SONG_TABLE_NAME,
      Key: { songId: { S: b.songId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: songs for songId not found: ${b.songId}`); return }
  const song = unmarshall(res0.Item!)
  if (hasSubstring(event.info.selectionSetList, "creator")) {
    const res1 = await dynamo.send(
      new GetItemCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId: { S: song.userId } }
      })
    )
    if (!res1.Item) { console.error(`ERROR: user for userId not found: ${song.userId}`); return }
    song.creator = unmarshall(res1.Item)
    
  }

  return song
}