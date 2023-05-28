import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { chordSheetToOslynSong } from '../../util/oslyn'
import { updateDynamoUtil } from '../../util/dynamo'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  songId: string, 
  title?: string,
  songAuthor?: string,
  // 4/4 = 4, 6/8 = 6, 3/4 = 3, 2/4 = 2
  beat?: { count?: number, note?: number }
  approved?: boolean

  chordSheet?: string
  chordSheetKey?: string
  originPlatorm?: "UG" | "OTHER"
  originLink?: string
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
  
  if (res0.Item) {
    const updateSong = {
      songId: b.songId, title: b.title, beat: b.beat, approved: b.approved,
      chordSheet: b.chordSheet, chordSheetKey: b.chordSheetKey, 
      originPlatorm: b.originPlatorm, originLink: b.originLink
    }
  
    const params = updateDynamoUtil({ table: SONG_TABLE_NAME, item: updateSong })
    const res1 = await dynamo.send(new UpdateItemCommand(params))
    console.log(res1)

    let song = { ...res0.Item, ...updateSong, oslynSong: null as any }
    let cs =  b.chordSheet || unmarshall(res0.Item).chordSheet
    let key = b.chordSheetKey || unmarshall(res0.Item).chordSheetKey
    if (cs && key) song.oslynSong = chordSheetToOslynSong(cs, key, true)
  
    return song
    
  } else {
    console.error(`ERROR: songId not found: ${b.songId}`)
    return
  }
}