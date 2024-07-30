import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { hasSubstring, merge } from '../../util/dynamo'

import { Participant, User } from '../../API'
import { _JamSession, _JamSong, _SetList } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, userId?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.setListId is empty`); return }
  
  const dynamo = new DynamoDBClient({})
  const res1 = await dynamo.send(
    new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } }
    })
  )
  if (!res1.Item) { console.error(`ERROR: jamSessionId not found: ${b.jamSessionId}`); return }
  let jamSession = unmarshall(res1.Item) as _JamSession

  // check authorization
  if (jamSession.policy === "PRIVATE") {
    if (!b.userId) { console.error(`This is a private jam session.`); return }
    
    if ((jamSession.adminIds || []).includes(b.userId)) { console.log("is an admin, athorized") }
    else if ((jamSession.memberIds || []).includes(b.userId)) { console.log("is a member, athorized") }
    else { console.error(`This is a private jam session.`); return }
  }

  if (hasSubstring(event.info.selectionSetList, "setList")) {
    console.log("getting setList ...")
    const res2 = await dynamo.send(
      new GetItemCommand({
        TableName: SETLIST_TABLE_NAME,
        Key: { setListId: { S: jamSession.setListId } }
      })
    )
    if (!res2.Item) { console.error(`ERROR: setListId not found: ${jamSession.setListId}`); return }

    let setList = unmarshall(res2.Item) as _SetList
    console.log(setList)

    if (hasSubstring(event.info.selectionSetList, "setList/songs")) {
      console.log("getting setList/songs ..")
      const songIds = (setList.songs as _JamSong[]).map((s) => { return s!.songId as string })
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

      if (hasSubstring(event.info.selectionSetList, "creator")) {
        console.log("getting setList/songs/../creator ..")
      }

      setList.songs = merge(setList.songs, songs, 'songId', 'song')
    }

    if (hasSubstring(event.info.selectionSetList, "setList/creator")) {
      console.log("getting setList/creator ..")
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

  if (hasSubstring(event.info.selectionSetList, "admin")) {
    jamSession.admins = [] as User[]
  }

  // TODO: members
  if (hasSubstring(event.info.selectionSetList, "members")) {
    jamSession.members = []
  }

  if (hasSubstring(event.info.selectionSetList, "active")) {
    console.log("getting active ..")
    const tmp = (jamSession.active || []).map((s) => { 
      if (s?.participantType === "USER") return  s?.userId || ""
      return ""
    }).filter((i) => { return i != "" }) as string[]
    const uniq = [...new Set(tmp)]

    const keys = uniq.map((s) => { return { userId: { S: s } }})
    
    if (keys.length > 0) {
      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
  
      const active = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u) as User
  
        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
  
        return user
      })

      console.log(JSON.stringify(jamSession.active))
      jamSession.active = merge(jamSession.active, active, "userId", "user") as Participant[]
      console.log(JSON.stringify(jamSession.active))
    }
  }
  
  console.log(JSON.stringify(jamSession))
  return jamSession
}