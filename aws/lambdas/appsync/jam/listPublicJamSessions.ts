import { BatchGetItemCommand, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge } from '../../util/dynamo'

import { _JamSession, _SetList, _Song, _User } from '../../type'

import { AppSyncResolverEvent } from 'aws-lambda'
import { User } from '../../API'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{}, null>) => {
  console.log(event)
  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new ScanCommand({
      TableName: JAM_TABLE_NAME,
      Select: "ALL_ATTRIBUTES",
      ScanFilter: {
        policy: { 
          AttributeValueList: [ { S: "PUBLIC" }],
          ComparisonOperator: "BEGINS_WITH"
        }
      }
    })
  )

  if (!res0) { console.log("ERROR: empty scan response"); return }
  if (res0.Items && res0.Items.length === 0) return []

  let sessions = res0.Items!.map(s => {
    let jam = unmarshall(s) as _JamSession
    if (!jam.activeIds) jam.activeIds = []
    return jam
  })

  if (hasSubstring(event.info.selectionSetList, "setList")) {
    console.log("getting setList ...")

    const setIds = sessions.map((s) => s.setListId)
    const uniq = [...new Set(setIds)]

    const keys = uniq
      .map((s) => { return { setListId: { S: s } } as { [setListId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[SETLIST_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet setListId. ${res1.$metadata}`); return }
    let sets = res1.Responses![SETLIST_TABLE_NAME].map(s => unmarshall(s)) as _SetList[]

    if (hasSubstring(event.info.selectionSetList, "setList/songs")) {
      console.log("getting songs ...")
  
      const songIds = sets.map((s) => { 
        let r = [] as string[]
        for (const k of s.songs) { k?.songId && r.push(k?.songId)}
        return r as string[]
      })
  
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
          return s
        })
      }
      
      for (let i=0; i<sets.length; i++) {
        sets[i].songs = merge(sets[i].songs, songs, 'songId', 'song')
      }
    }

    if (hasSubstring(event.info.selectionSetList, "setList/creator")) {
      console.log("getting creator (user) ...")
  
      const setUsers = sets.map((s) => { return s.userId as string })
      const uniq = [...new Set(setUsers)]
  
      const keys = uniq
      .map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)
  
      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
      
      const users = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u)
        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })
  
      console.log(users)
      sets = merge(sets, users, 'userId', 'creator')
    }

    // TODO: editors
    if (hasSubstring(event.info.selectionSetList, "setList/editors")) {
      sets = sets.map((e) => { return { ...e, editors: [] } })
    }
    
    sessions = merge(sessions, sets, "setListId", "setList")
  }

  if (hasSubstring(event.info.selectionSetList, "active")) {
    console.log("getting active users ...")

    const userIds = sessions.map((b) => { 
      let r = [] as string[]
      for (const k of b?.activeIds!) { k && r.push(k)}
      return r as string[]
    })

    const uniq = [...new Set(userIds.flat(1))]

    if (uniq && uniq.length > 0) {
      const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
      
      const users = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u)
        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })

      console.log(users)
      for (let i=0; i<sessions.length; i++) {
        sessions[i].active = merge(sessions[i].activeIds, users, 'userId', 'active')
      }
    } else {
      console.log("NONE of these sessions have active users, continue ..")
      for (let i=0; i<sessions.length; i++) { sessions[i].active = [] }
    }
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    // userId is automatically an admin
    const userIds = sessions.map( s => s.userId! ) as string[]
    const uniq = [...new Set(userIds)]

    const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
    
    const users = res1.Responses![USER_TABLE_NAME].map((u) => {
      let user = unmarshall(u)
      if (!user.labelledRecording) user.labelledRecording = []
      if (!user.songsCreated) user.songsCreated = []
      if (!user.editHistory) user.editHistory = []
      if (!user.likedSongs) user.likedSongs = []
      if (!user.friends) user.friends = []
      return user
    })

    console.log(users)
    sessions = merge(sessions, users, 'userId', 'admins') // this injects the single user .. we dont want that.
    sessions.map(s => { s.admins = [s.admins as unknown as User] }) // TODO. fix admin to admins
  }

  if (hasSubstring(event.info.selectionSetList, "members")) {
    sessions.map(s => { if (!s.members) s.members = [] })
  }

  if (hasSubstring(event.info.selectionSetList, "guests")) {
    sessions.map(s => { if (!s.guests) s.guests = [] })
  }

  return sessions
}