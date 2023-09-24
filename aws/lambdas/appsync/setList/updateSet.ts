import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'

import { hasSubstring, merge, updateDynamoUtil } from '../../util/dynamo'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { User } from '../../API'

import { _SetList, _JamSong, _Song } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  setListId: string, userId?: string, description?: string, 
  songs?: {
    songId: string, key: string, order: number
  }[], bandId?: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.setListId) { console.error(`b.setListId is empty`); return }
  
  console.log(JSON.stringify(b.songs))

  const dynamo = new DynamoDBClient({})
  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: SETLIST_TABLE_NAME,
      Key: { setListId: { S: b.setListId } }
    })
  )

  if (!res0.Item) { console.error(`could not find setListId: ${b.setListId}`); return }
  let setList = unmarshall(res0.Item!) as _SetList

  let updateSet = {} as any

  if (b.userId) updateSet.userId = b.userId
  if (b.description) updateSet.description = b.description
  if (b.songs) updateSet.songs = b.songs
  if (b.bandId) updateSet.bandId = b.bandId
  
  const params = updateDynamoUtil({ table: SETLIST_TABLE_NAME, item: updateSet, key: { setListId: b.setListId } })
  const res1 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res1)

  setList = { ...setList, ...updateSet } as _SetList
  if (!setList.editors) setList.editors = []

  if (hasSubstring(event.info.selectionSetList, "songs")) {
    console.log("getting songs ...")

    const songIds = setList.songs.map((s) => (s as _JamSong).songId!)

    const uniq = [...new Set(songIds.flat(1))]
    console.log(uniq)

    const keys = uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[SONG_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 
    
    let songs = res1.Responses![SONG_TABLE_NAME].map((s) => unmarshall(s)) as _Song[]
    console.log(songs)

    if (hasSubstring(event.info.selectionSetList, "song/creator")) {
      console.log("getting songs/../song/creator ..")

      const creatorIds = songs.map((s) => { return s.userId })
      const uniq = [...new Set(creatorIds)]
      
      const keys = uniq.map((s) => { return { userId: { S: s } } })
      const res2 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res2)
      if (!res2.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return }

      console.log(JSON.stringify(res2.Responses))
      const users = res2.Responses![USER_TABLE_NAME].map((s) => unmarshall(s)) as User[]
      console.log(users)

      songs = merge(songs, users, 'userId', 'creator')
      console.log(songs)

      songs = songs.map((s) => {
        if (!s.recordings) s.recordings = []
        if (!s.editors) s.editors = []
        if (!s.viewers) s.viewers = []
        return s
      })
    }

    setList.songs = merge(setList.songs, songs, 'songId', 'song')
  }

  if (hasSubstring(event.info.selectionSetList, "creator")) {
    console.log("getting creator (user) ...")
    console.log(setList)

    const res1 = await dynamo.send(
      new GetItemCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId: { S: setList.userId } }
      })
    )
    if (!res1.Item) { console.error(`ERROR: user for userId not found: ${setList.userId}`); return }

    setList.creator = unmarshall(res1.Item)as User
    if (!setList.creator.labelledRecording) setList.creator.labelledRecording = []
    if (!setList.creator.songsCreated) setList.creator.songsCreated = []
    if (!setList.creator.editHistory) setList.creator.editHistory = []
    if (!setList.creator.likedSongs) setList.creator.likedSongs = []
    if (!setList.creator.friends) setList.creator.friends = []
  }

  console.log(setList)
  return setList
}