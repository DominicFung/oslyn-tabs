import { BatchGetItemCommand, DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { AppSyncResolverEvent } from 'aws-lambda'
import { hasSubstring } from '../../util/dynamo'

import { _Band, _User } from '../../type'
import { Band, User } from '../../API'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.userId } }
    })
  )

  if (!res0 || !res0.Item) { console.error(`dynamo did not return a res0 for userId`); return }
  let user = unmarshall(res0.Item) as _User

  if (hasSubstring(event.info.selectionSetList, "bands")) {
    if (!user.bandIds || user.bandIds.length === 0) { user.bands = [] }
    else {
      console.log("getting bands ...")
      const uniq = [...new Set(user.bandIds)]

      const keys = uniq
        .map((s) => { return { bandId: { S: s } } as { [bandId: string]: any } })
        console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[BAND_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet bandId. ${res1.$metadata}`); return  } 

      const bands: Band[] = res1.Responses![BAND_TABLE_NAME].map((u) => {
        let band = unmarshall(u) as _Band

        band.songs = []
        band.sets = []
        band.members = []
        band.admins = []

        band.owner = {
          userId: band.userId, username: "", email: "dom@oslyn.io", providers: [], role: "USER",
          friends: [], labelledRecording: [], songsCreated: [], editHistory: [], likedSongs: []
        } as unknown as User

        return band
      })
      console.log(bands)
      user.bands = bands
    }
  }

  if (hasSubstring(event.info.selectionSetList, "friends")) {
    if (!user.friendIds || user.friendIds.length === 0) { user.friends = [] }
    else {
      console.log("getting friends ...")
      const uniq = [...new Set(user.friendIds)]

      const keys = uniq
        .map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
        console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 

      const friends = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u) as _User
  
        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })
      console.log(friends)
      user.friends = friends
    }
  }

  console.log(user)
  return user
}