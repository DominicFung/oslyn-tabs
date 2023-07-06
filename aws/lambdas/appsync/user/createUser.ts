import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'
import { User, provider } from '../../API'
import { updateDynamoUtil } from '../../util/dynamo'

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
    
    let user = {} as User 
    let savedUser = unmarshall(res0.Items[0]) as User
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

    // Catch if no updates needed
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
    const userId = uuidv4()

    const user = {
      userId, username: b.username,
      firstName: b.firstName || "", 
      lastName: b.lastName || "",
      isActivated: true,
      createDate: Date.now(),

      providers: [b.provider],
      email: b.email, 
      role: "USER",
      labelledRecording: [],
      songsCreated: [],
      editHistory: [],
      likedSongs: []
    } as any

    const res1 = await dynamo.send(
      new PutItemCommand({
        TableName: USER_TABLE_NAME,
        Item: marshall(user)
      })
    )
    console.log(res1)
    console.log(`new user: ${JSON.stringify(user, null, 2)}`)

    return user
  }
}