import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'
import { provider } from '../../API'
import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'

import { _User } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  email: string, username: string, provider: provider, 
  firstName?: string, lastName?: string, imageUrl?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.username) { console.error(`b.username is empty`); return }
  if (!b.email) { console.error(`b.email is empty`); return }
  if (!b.provider) { console.error(`b.provider is empty`); return }

  const dynamo = new DynamoDBClient({})

  /** check if email is already taken */
  const res0 = await dynamo.send(
    new QueryCommand({
      TableName: USER_TABLE_NAME,
      IndexName: "email",
      KeyConditionExpression: "email = :key",
      ExpressionAttributeValues: { ":key": { S: b.email } }
    })
  )

  if (!res0) { console.error(`dynamo did not return a res0 for email`); return }
  if (res0.Count! > 0 && res0.Items) {
    console.log(" === USER ALREADY EXIST === ")
    
    let user = {} as _User 
    const savedUser = unmarshall(res0.Items[0]) as _User
    console.log(savedUser)

    if (b.username != savedUser.username) user.username = b.username
    if (b.firstName && b.firstName != savedUser.firstName) user.firstName = b.firstName
    if (b.lastName && b.lastName != savedUser.lastName) user.lastName = b.lastName
    
    if (savedUser.providers && !savedUser.providers.includes(b.provider)) {
      savedUser.providers.push(b.provider)
    }

    if (b.imageUrl && b.imageUrl != savedUser.imageUrl) {
      user.imageUrl = b.imageUrl
    }

    if (hasSubstring(event.info.selectionSetList, "friends")) {
      console.log("friends ..")
      if (savedUser.friendIds && savedUser.friendIds.length > 0) {
        console.log("friendIds found, fetching friend details ..")
        const uniq = [...new Set(savedUser.friendIds)]

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
        savedUser.friends = users
      } else { savedUser.friends = [] }

      console.log(user)
    }

    // If there are no updates, return whatever's saved.
    if ( Object.keys(user).length === 0 ) return savedUser

    const params = updateDynamoUtil({
      table: USER_TABLE_NAME,
      key: { userId: savedUser.userId },
      item: user
    })
    
    const res1 = await dynamo.send(new UpdateItemCommand(params))
    console.log(res1)

    return { ...savedUser, ...user }
  } else {
    const userId = `${uuidv4()}_usr`

    const user = {
      userId, username: b.username,
      firstName: b.firstName || "", 
      lastName: b.lastName || "",
      isActivated: true,
      imageUrl: b.imageUrl || "",
      createDate: Date.now(),

      providers: [b.provider],
      email: b.email, 
      role: "USER",
      labelledRecording: [],
      songsCreated: [],
      editHistory: [],
      likedSongs: [],
      friendIds: []
    } as any

    const res1 = await dynamo.send(
      new PutItemCommand({
        TableName: USER_TABLE_NAME,
        Item: marshall(user)
      })
    )
    console.log(res1)
    console.log(`new user: ${JSON.stringify(user, null, 2)}`)

    return { ...user, friends: [] }
  }
}