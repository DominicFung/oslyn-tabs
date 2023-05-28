import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  email: string, username: string, firstName?: string, lastName?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.username) { console.error(`b.username is empty`); return }
  if (!b.email) { console.error(`b.email is empty`); return }

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

    return
  } else {
    const userId = uuidv4()

    const user = {
      userId, username: b.username,
      firstName: b.firstName || b.username, 
      lastName: b.lastName || "",
      isActivated: true,
      createDate: Date.now(),

      email: b.email, 
      roles: "USER",
      labelledRecording: [],
      songsCreated: [],
      editHistory: []
    }

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