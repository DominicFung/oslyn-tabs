// Add user to band with specific role
import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { v4 as uuidv4 } from 'uuid'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const USER_BAND_MEMBERSHIP_TABLE = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  bandId: string,
  userId: string,
  role: 'ADMIN' | 'MEMBER'
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.bandId) { console.error(`b.bandId is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }
  if (!b.role) { console.error(`b.role is empty`); return }

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

    // 3. Add user to band membership
    const roleId = uuidv4()
    await dynamo.send(new PutItemCommand({
      TableName: USER_BAND_MEMBERSHIP_TABLE,
      Item: marshall({
        userId: b.userId,
        bandId: b.bandId,
        role: b.role,
        joinedAt: Date.now()
      })
    }))

    // 4. Update user's bandMemberships array
    const userBandMemberships = user.bandMemberships || []
    const existingMembership = userBandMemberships.find((membership: any) => membership.bandId === b.bandId)
    
    if (!existingMembership) {
      userBandMemberships.push({
        bandId: b.bandId,
        role: b.role || 'MEMBER',
        joinedAt: Date.now()
      })
      
      await dynamo.send(new PutItemCommand({
        TableName: USER_TABLE_NAME,
        Item: marshall({
          ...user,
          bandMemberships: userBandMemberships
        })
      }))
    }

    // 5. Update band's memberIds array
    const bandMemberIds = band.memberIds || []
    if (!bandMemberIds.includes(b.userId)) {
      bandMemberIds.push(b.userId)
      
      await dynamo.send(new PutItemCommand({
        TableName: BAND_TABLE_NAME,
        Item: marshall({
          ...band,
          memberIds: bandMemberIds
        })
      }))
    }

    // 6. Return UserBandRole
    const userBandRole = {
      roleId,
      user,
      band,
      role: b.role
    }

    console.log(`User ${b.userId} added to band ${b.bandId} with role ${b.role}`)
    return userBandRole

  } catch (error) {
    console.error('Error in addUserToBand:', error)
    return null
  }
}
