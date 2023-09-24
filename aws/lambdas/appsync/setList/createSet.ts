import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, GetItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'
import { hasSubstring, merge } from '../../util/dynamo'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, description: string, songs: {
    songId: string, key: string, order: Number
  }[], bandId?: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.userId) { console.error(`b.creatorId is empty`); return }
  if (!b.description) { console.error(`b.description is empty`); return }

  console.log(JSON.stringify(b.songs))

  const dynamo = new DynamoDBClient({})
  const setListId = uuidv4()
  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.userId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: userId not found: ${b.userId}`); return }
  const creator = { ...unmarshall(res0.Item), friends: []}
  
  let setList = { setListId, description: b.description, userId: b.userId } as any
  setList.songs = b.songs

  const res1 = await dynamo.send(new PutItemCommand({
    TableName: SETLIST_TABLE_NAME, Item: marshall(setList)
  }))
  console.log(res1)

  if (hasSubstring(event.info.selectionSetList, "songs")) {
    const songIds = b.songs.map((s) => { return s.songId as string })
    const uniq = [...new Set(songIds)]

    const keys = uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[SONG_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 

    const songs = res1.Responses![SONG_TABLE_NAME].map((u) => {
      let song = unmarshall(u)
      if (!song.creator) song.creator = creator
      if (!song.editors) song.editors = []
      if (!song.viewers) song.viewers = []
      return song
    })
    console.log(songs)
    setList.songs = merge(setList.songs, songs, 'songId', 'song')
  }
  
  setList.editors = []
  setList.creator = creator
  
  console.log(JSON.stringify(setList))
  return setList
}