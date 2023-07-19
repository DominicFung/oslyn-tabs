import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge } from '../../util/dynamo'
import { User } from '../../API'

import { _SetList, _JamSong, _Song } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new QueryCommand({
      TableName: SETLIST_TABLE_NAME,
      IndexName: "owner",
      KeyConditionExpression: "userId = :key",
      ExpressionAttributeValues: { ":key": { S: b.userId } }
    })
  )

  if (!res0.Items) {
    console.error(`ERROR: songs for userId not found: ${b.userId}`)
    return []
  }

  let sets = res0.Items?.map((e) => unmarshall(e)) as _SetList[]
  console.log(sets)

  if (hasSubstring(event.info.selectionSetList, "songs")) {
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

  if (hasSubstring(event.info.selectionSetList, "creator")) {
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
      return user
    })

    console.log(users)
    sets = merge(sets, users, 'userId', 'creator')
  }

  // TODO: editors
  if (hasSubstring(event.info.selectionSetList, "editors")) {
    sets = sets.map((e) => { return { ...e, editors: [] } })
  }
  
  console.log(JSON.stringify(sets))
  return sets
}