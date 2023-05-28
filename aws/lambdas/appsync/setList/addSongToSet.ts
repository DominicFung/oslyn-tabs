import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  setListId: string, songId: string, key: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.setListId) { console.error(`b.setListId is empty`); return }
  if (!b.songId) { console.error(`b.songId is empty`); return }
  if (!b.key) { console.error(`b.key is empty`); return }

  const dynamo = new DynamoDBClient({})
  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: SETLIST_TABLE_NAME,
      Key: { setListId: { S: b.setListId } }
    })
  )
  if (!res0.Item) { console.error(`ERROR: setListId not found: ${b.setListId}`); return }
  let setList = unmarshall(res0.Item)
  if (!setList.creatorId) { console.error(`ERROR: setList.creatorId not found in unmarshall(setList): ${setList.creatorId}`); return }

  const res1 = await dynamo.send(
    new GetItemCommand({
      TableName: SONG_TABLE_NAME,
      Key: { songId: { S: b.songId } }
    })
  )
  if (!res1.Item) { console.error(`ERROR: songId not found: ${b.songId}`); return }

  const res2  = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: setList.creatorId } }
    })
  )
  if (!res2.Item) { console.error(`ERROR: setList.creatorId not found: ${setList.creatorId}`); return }
  const creator = unmarshall(res2.Item)
  
  const jamSong = { songId: b.songId, key: b.key }
  let setListSongs = setList.songs as {songId: string, key: string}[]
  setListSongs.push(jamSong)
  setList.songs = setListSongs

  let params = updateDynamoUtil({ table: SETLIST_TABLE_NAME, item: { songs: setListSongs }})
  const res3 = await dynamo.send( new UpdateItemCommand(params) )
  console.log(res3)

  if (hasSubstring(event.info.selectionSetList, "creator")) { setList.creator = [creator] }
  if (hasSubstring(event.info.selectionSetList, "editors")) { 
    const keys = setList.editorIds.map((s: string) => { return {userId: s} as { [userId: string]: any } })
    const res2 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {USER_TABLE_NAME: { Keys: keys }}
    }))
    console.log(res2)
    if (!res2.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res2.$metadata}`); return  } 

    const editors = res2.Responses![SONG_TABLE_NAME]
    setList.editors = editors
  }
  
  return setList
}