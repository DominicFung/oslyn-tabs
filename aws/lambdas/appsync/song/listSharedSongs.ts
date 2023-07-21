import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge } from '../../util/dynamo'

import { _Song, _User } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, optimize: boolean
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.userId) { console.error(`b.userId is empty`); return }
  const optimize = new Boolean(b.optimize)

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId : { S: b.userId } }
    })
  )

  if (!res0) { console.error(`ERROR: could not find userId: ${b.userId}`); return }
  let user = unmarshall(res0.Item!) as _User
  console.log(user)

  if (optimize) {
    // only search friends list
    const uniq = [...new Set(user.friendIds)]

    const keys = uniq
      .map((s) => { return { ":key": { S: s } } as { [b: string]: any } })
    console.log(keys)

    let promises = []
    for (const item of keys) {
      promises.push(dynamo.send(
        new QueryCommand({
          TableName: SONG_TABLE_NAME,
          IndexName: "userId",
          KeyConditionExpression: "userId = :key",
          ExpressionAttributeValues: item
        })
      ))
    }

    const res3 = await Promise.all(promises)
    let songs = res3.map((d) => d.Items!.map(u => unmarshall(u) as _Song)).flat(1)
    console.log(songs)

    songs = songs.filter(s => {
        console.log(s)
        if (s) {
          if (s.adminIds && s.adminIds.length > 0 && s.adminIds.includes(b.userId)) { 
            console.log(` ${JSON.stringify(s.adminIds)} has ${b.userId}`); return true 
          } else if (s.editorIds && s.editorIds.length > 0 && s.editorIds.includes(b.userId)){ 
            console.log(` ${JSON.stringify(s.editorIds)} has ${b.userId}`); return true 
          } else if (s.viewerIds && s.viewerIds.length > 0 && s.viewerIds.includes(b.userId)) {
            console.log(` ${JSON.stringify(s.viewerIds)} has ${b.userId}`); return true
          } else return false
        }
        return false
    })

    console.log(songs)
    if (songs.length === 0) return songs

    if (hasSubstring(event.info.selectionSetList, "creator")) {
      console.log("getting creator (user) ...")

      const songUsers = songs.map((s) => { return s.userId as string })
      const uniq = [...new Set(songUsers)]

      const keys = uniq
        .map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
      
      const users = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u) as _User

        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })
      console.log(users)
      songs = merge(songs, users, 'userId', 'creator')
    }

    if (hasSubstring(event.info.selectionSetList, "editors")) {
      // TODO - acutally get editors - only if this list Songs function is for owners.
      songs = songs.map(s => { s.editors = []; return s })
    }

    if (hasSubstring(event.info.selectionSetList, "viewers")) {
      // TODO - acutally get viewers - only if this list Songs function is for owners.
      songs = songs.map(s => { s.viewers = []; return s })
    }

    return songs
  }

  console.error(`ERROR: set optimize to true, un-optimized is not implemented`)
  return
}