import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { _Band, _Song, _User } from '../../type'
import { hasSubstring } from '../../util/dynamo'
// import { User } from '../../API'

// const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
// const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
// const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const USER_BAND_ROLE_TABLE_NAME = process.env.USER_BAND_ROLE_TABLE_NAME || ''

interface _UserBandRole {
  roleId: string,
  userId: string,
  bandId: string,
  role: "MEMBER" | "ADMIN"
}

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new QueryCommand({
      TableName: USER_BAND_ROLE_TABLE_NAME,
      IndexName: "user",
      KeyConditionExpression: "userId = :key",
      ExpressionAttributeValues: { ":key": { S: b.userId } }
    })
  )

  if (!res0.Items) {
    console.error(`ERROR: bands for userId not found: ${b.userId}`)
    return []
  }

  let userBandRoles = res0.Items?.map((e) => {
    return unmarshall(e) as _UserBandRole
  })

  console.log(userBandRoles)
  if (userBandRoles.length === 0) { console.log(`userBandRoles is empty, returning`); return [] }

  if (hasSubstring(event.info.selectionSetList, "user")) {
    console.log("getting users ...")
    
  }

  return 

}