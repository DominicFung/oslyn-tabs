import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, GetItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'
import { hasSubstring, merge } from '../../util/dynamo'
import { JamSession, JamSong, SetList, User } from '../../API'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

type _SetList = SetList & {
  userId: string
  songs: _JamSong[]
}

type _JamSong = JamSong & {
  songId: string
}

export const handler = async (event: AppSyncResolverEvent<{
  setListId: string, userId: string, policy: string, bandId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.userId) { console.error(`b.creatorId is empty`); return }
  if (!b.setListId) { console.error(`b.setListId is empty`); return }

  const policy = b.policy ||  "PUBLIC_VIEW" //"PRIVATE"

  const dynamo = new DynamoDBClient({})
  const jamSessionId = uuidv4()

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.userId } }
    })
  )
  if (!res0.Item) { console.error(`ERROR: userId not found: ${b.userId}`); return }

  const res1 = await dynamo.send(
    new GetItemCommand({
      TableName: SETLIST_TABLE_NAME,
      Key: { setListId: { S: b.setListId } }
    })
  )
  if (!res1.Item) { console.error(`ERROR: setListId not found: ${b.setListId}`); return }
  
  let jamSession = {
    jamSessionId, setListId: b.setListId, userId: b.userId,

    currentSong: 0, currentPage: 0,
    startDate: Date.now(),
    policy: policy,

    pageSettings: {
      pageMax: 3, pageMin: 2
    },

    active: []
  } as any

  const res2 = await dynamo.send(new PutItemCommand({
    TableName: JAM_TABLE_NAME, Item: marshall(jamSession)
  }))
  console.log(res2)

  if (hasSubstring(event.info.selectionSetList, "setList")) {
    let setList = unmarshall(res1.Item) as _SetList
    console.log(setList)

    if (hasSubstring(event.info.selectionSetList, "setList/songs")) {
      const songIds = setList.songs.map((s) => { return (s as _JamSong).songId as string })
      const uniq = [...new Set(songIds)]
  
      const keys = uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } })
      console.log(keys)
  
      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[SONG_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 
  
      const songs = res1.Responses![SONG_TABLE_NAME].map((u) => unmarshall(u))
      console.log(songs)
      setList.songs = merge(setList.songs, songs, 'songId', 'song')
    }

    if (hasSubstring(event.info.selectionSetList, "setList/creator")) {
      const res2 = await dynamo.send(new GetItemCommand({
        TableName: USER_TABLE_NAME, Key: { userId: { S: setList.userId } }
      }))
      console.log(res2)
      if (!res2.Item) { console.error(`ERROR: unable to get setList.userId. ${res1.$metadata}`); return  }
      let creator = unmarshall(res2.Item) as User

      if (!creator.labelledRecording) creator.labelledRecording = []
      if (!creator.songsCreated) creator.songsCreated = []
      if (!creator.likedSongs) creator.likedSongs = []
      if (!creator.friends) creator.friends = []
      
      setList.creator = creator
    }

    // TODO: editors
    if (hasSubstring(event.info.selectionSetList, "setList/editors")) {
      setList.editors = []
    }
    
    jamSession.setList = setList
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    jamSession.admins = [unmarshall(res0.Item)]
    if (!jamSession.admins[0].labelledRecording) jamSession.admins[0].labelledRecording = []
    if (!jamSession.admins[0].songsCreated) jamSession.admins[0].songsCreated = []
    if (!jamSession.admins[0].editHistory) jamSession.admins[0].editHistory = []
    if (!jamSession.admins[0].likedSongs) jamSession.admins[0].likedSongs = []
    if (!jamSession.admins[0].friends) jamSession.admins[0].friends = []
  }

  // TODO: members
  if (hasSubstring(event.info.selectionSetList, "members")) {
    jamSession.members = []
  }

  // TODO: guests
  if (hasSubstring(event.info.selectionSetList, "guests")) {
    jamSession.guests = []
  }

  console.log(JSON.stringify(jamSession))
  return jamSession as JamSession
}