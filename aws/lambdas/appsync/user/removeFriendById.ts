import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { AppSyncResolverEvent } from 'aws-lambda'
import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'

import { _User } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, friendId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.userId) { console.error(`b.userId is empty`); return }
  if (!b.friendId) { console.error(`b.friendId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.userId } }
    })
  )

  if (!res0 || !res0.Item) { console.error(`dynamo did not return a res0 for userId`); return }
  let user = unmarshall(res0.Item) as _User
  user.friendIds = user.friendIds || []

  if (!user.friendIds.includes(b.friendId)) { console.error(`user does not have friendId: ${b.friendId}`); return }
  user.friendIds.some(v => v === b.friendId)
  
  const uniq = [...new Set(user.friendIds)]
  let params = updateDynamoUtil({
    table: USER_TABLE_NAME, 
    item: { friendIds: uniq },
    key: { userId: user.userId }
  })

  const res1 = await dynamo.send( new UpdateItemCommand(params) )
  console.log(res1)
  if (!res1) { console.error(`unble to remove friend: ${b.friendId}`); return }

  if (hasSubstring(event.info.selectionSetList, "friends")) {
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

  return user
}