// Remove user from band
import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, DeleteItemCommand, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const USER_BAND_MEMBERSHIP_TABLE = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  bandId: string,
  userId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.bandId) { console.error(`b.bandId is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  try {
    // 1. Verify band exists
    const bandResult = await dynamo.send(
      new GetItemCommand({
        TableName: BAND_TABLE_NAME,
        Key: { bandId: { S: b.bandId } }
      })
    )
    if (!bandResult.Item) { 
      console.error(`ERROR: bandId not found: ${b.bandId}`); 
      return null 
    }

    // 2. Verify user exists
    const userResult = await dynamo.send(
      new GetItemCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId: { S: b.userId } }
      })
    )
    if (!userResult.Item) { 
      console.error(`ERROR: userId not found: ${b.userId}`); 
      return null 
    }

    const band = unmarshall(bandResult.Item)
    const user = unmarshall(userResult.Item)

    // 3. Remove user from band membership
    await dynamo.send(new DeleteItemCommand({
      TableName: USER_BAND_MEMBERSHIP_TABLE,
      Key: {
        userId: { S: b.userId },
        bandId: { S: b.bandId }
      }
    }))

    // 4. Update user's bandMemberships array
    const userBandMemberships = user.bandMemberships || []
    const updatedUserBandMemberships = userBandMemberships.filter((membership: any) => membership.bandId !== b.bandId)
    
    await dynamo.send(new PutItemCommand({
      TableName: USER_TABLE_NAME,
      Item: marshall({
        ...user,
        bandMemberships: updatedUserBandMemberships
      })
    }))

    // 5. Update band's memberIds array
    const bandMemberIds = band.memberIds || []
    const updatedBandMemberIds = bandMemberIds.filter((memberId: string) => memberId !== b.userId)
    
    await dynamo.send(new PutItemCommand({
      TableName: BAND_TABLE_NAME,
      Item: marshall({
        ...band,
        memberIds: updatedBandMemberIds
      })
    }))

    console.log(`User ${b.userId} removed from band ${b.bandId}`)
    return band

  } catch (error) {
    console.error('Error in removeUserFromBand:', error)
    return null
  }
}
