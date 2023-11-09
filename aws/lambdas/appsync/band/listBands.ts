import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { _Band, _Song, _User } from '../../type'
import { hasSubstring, merge, multiMerge } from '../../util/dynamo'
import { User } from '../../API'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new QueryCommand({
      TableName: BAND_TABLE_NAME,
      IndexName: "owner",
      KeyConditionExpression: "userId = :key",
      ExpressionAttributeValues: { ":key": { S: b.userId } }
    })
  )

  if (!res0.Items) {
    console.error(`ERROR: bands for userId not found: ${b.userId}`)
    return []
  }

  let bands = res0.Items?.map((e) => {
    let band = unmarshall(e) as _Band
    if (!band.songIds) band.songIds = []
    return band
  })
  console.log(bands)
  if (bands.length === 0) { console.log(`bands is empty, returning.`); return bands }

  if (hasSubstring(event.info.selectionSetList, "owner")) {
    console.log("getting owner ...")
    const res1 = await dynamo.send(
      new GetItemCommand({TableName: USER_TABLE_NAME, Key: { userId: { S: b.userId } }})
    )

    if (!res1.Item) { console.error("ERROR: Could not find band owner."); return }
    const owner = unmarshall(res1.Item) as _User

    if (!owner.labelledRecording) owner.labelledRecording = []
    if (!owner.songsCreated) owner.songsCreated = []
    if (!owner.editHistory) owner.editHistory = []
    if (!owner.likedSongs) owner.likedSongs = []
    if (!owner.friends) owner.friends = []

    bands = bands.map(b => { return { ...b, owner } })
  }
  
  if (hasSubstring(event.info.selectionSetList, "songs")) {
    console.log("getting songs ...")

    const songIds = bands.map((b) => { 
      let r = [] as string[]
      for (const k of b?.songIds!) { k && r.push(k)}
      return r as string[]
    })

    const uniq = [...new Set(songIds.flat(1))]
    console.log(uniq)

    if (uniq && uniq.length > 0) {
      const keys = uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[SONG_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 
      
      let songs = res1.Responses![SONG_TABLE_NAME].map((s) => unmarshall(s)) as _Song[]
      console.log(songs)

      if (hasSubstring(event.info.selectionSetList, "songs/creator")) {
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
        let users = res2.Responses![USER_TABLE_NAME].map((s) => unmarshall(s)) as User[]
        console.log(users)

        users = users.map((u) => {
          let user = u
          if (!user.friends) user.friends = []
          return user
        })

        songs = merge(songs, users, 'userId', 'creator')
        console.log(songs)

        songs = songs.map((s) => {
          if (!s.recordings) s.recordings = []
          if (!s.editors) s.editors = []
          if (!s.viewers) s.viewers = []
          return s
        })
      }

      bands = multiMerge(bands || [], songs, 'songIds', 'songId', 'songs')
      console.log(JSON.stringify(bands))
    } else { 
      console.log("NONE of this user's bands has songs, continue ..")
      for (let i=0; i<bands.length; i++) { bands[i].songs = [] }
    }
  }

  // TODO: sets
  if (hasSubstring(event.info.selectionSetList, "sets")) {
    bands = bands.map((e) => { return { ...e, sets: [] } })
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    console.log("getting admins (user) ...")

    const adminIds = bands.map((b) => { 
      let r = [] as string[]
      for (const k of b?.adminIds!) { k && r.push(k)}
      return r as string[]
    })

    const uniq = [...new Set(adminIds.flat(1))]

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
      for (let i=0; i<bands.length; i++) {
        bands[i].admins = merge(bands[i].admins, users, 'userId', 'admin')
      }
    } else {
      console.log("NONE of this user's bands has admins, continue ..")
      for (let i=0; i<bands.length; i++) { bands[i].admins = [] }
    }
  }

  // TODO: members
  if (hasSubstring(event.info.selectionSetList, "members")) {
    bands = bands.map((e) => { return { ...e, members: [] } })
  }

  console.log(JSON.stringify(bands))
  return bands
}