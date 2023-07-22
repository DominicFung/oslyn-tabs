import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { _Band, _Song, _User } from '../../type'
import { hasSubstring, merge } from '../../util/dynamo'
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
  
  if (hasSubstring(event.info.selectionSetList, "songs")) {
    console.log("getting songs ...")

    const songIds = bands.map((b) => { 
      let r = [] as string[]
      for (const k of b?.songIds!) { k && r.push(k)}
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
    
    for (let i=0; i<bands.length; i++) {
      bands[i].songs = merge(bands[i].songs, songs, 'songId', 'song')
    }
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    console.log("getting admins (user) ...")

    const setUsers = bands.map((s) => { return s.userId as string })
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
    bands = merge(bands, users, 'userId', 'admins')
  }

  // TODO: members
  if (hasSubstring(event.info.selectionSetList, "members")) {
    bands = bands.map((e) => { return { ...e, members: [] } })
  }

  console.log(JSON.stringify(bands))
  return bands
}