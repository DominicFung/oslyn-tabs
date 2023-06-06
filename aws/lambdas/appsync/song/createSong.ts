import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  title: string, userId: string, chordSheetKey: string, chordSheet: string, 
  artist?: string, album?: string, albumCover?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.title) { console.error(`b.title is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }
  if (!b.chordSheetKey) { console.error(`b.chordSheetKey is empty`); return }
  if (!b.chordSheet) { console.error(`b.chordSheet is empty`); return }

  const dynamo = new DynamoDBClient({})
  const songId = uuidv4()

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.userId } }
    })
  )

  if (res0.Item) {
    let song = {
      songId, title: b.title, 
      userId: b.userId,
      chordSheetKey: b.chordSheetKey,
      chordSheet: b.chordSheet,

      isApproved: true,
      version: 1,    
      recordings: []
    } as any

    if (b.album) song.album = b.album
    if (b.artist) song.artist = b.artist
    if (b.albumCover) song.albumCover = b.albumCover

    const res1 = await dynamo.send(
      new PutItemCommand({
        TableName: SONG_TABLE_NAME,
        Item: marshall(song)
      })
    )
  
    console.log(res1)
    console.log(`new song: ${JSON.stringify(song, null, 2)}`)
    song.creator = unmarshall(res0.Item)
    return song
  } else {
    console.error(`ERROR: userId not found: ${b.userId}`)
    return
  }
}