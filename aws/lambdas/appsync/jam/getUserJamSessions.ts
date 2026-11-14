import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || ''

const debug = (...args: unknown[]) => {
  if (process.env.DEBUG_MODE === 'true') console.log(...args)
}

/**
 * Jam rooms for bands this user belongs to, including private rooms.
 * Does not change policy. Returns a flat session list (no nested setList).
 */
export const handler = async (event: AppSyncResolverEvent<{
  userId: string
}, null>) => {
  debug('getUserJamSessions called with event:', JSON.stringify(event, null, 2))
  const b = event.arguments
  if (!b?.userId) {
    console.error('userId is empty')
    return []
  }

  if (!USER_BAND_MEMBERSHIP_TABLE_NAME) {
    console.error('USER_BAND_MEMBERSHIP_TABLE_NAME is empty')
    return []
  }

  const dynamo = new DynamoDBClient({})

  try {
    const userBandsRes = await dynamo.send(new QueryCommand({
      TableName: USER_BAND_MEMBERSHIP_TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: b.userId }
      }
    }))

    if (!userBandsRes.Items || userBandsRes.Items.length === 0) {
      console.log('User is not a member of any bands')
      return []
    }

    const userBands = userBandsRes.Items
      .map((item) => unmarshall(item).bandId)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)

    if (userBands.length === 0) return []

    const expressionAttributeValues: { [key: string]: { S: string } } = {}
    const bandIdExpressions = userBands.map((bandId, index) => {
      expressionAttributeValues[`:bandId${index}`] = { S: bandId }
      return `:bandId${index}`
    })

    const jamRes = await dynamo.send(new ScanCommand({
      TableName: JAM_TABLE_NAME,
      FilterExpression: `bandId IN (${bandIdExpressions.join(', ')})`,
      ExpressionAttributeValues: expressionAttributeValues
    }))

    const jamSessions = (jamRes.Items || []).map((item) => {
      const jam = unmarshall(item)
      return {
        jamSessionId: jam.jamSessionId,
        bandId: jam.bandId,
        policy: jam.policy,
        description: jam.description || null,
        startDate: jam.startDate,
        endDate: jam.endDate,
        queue: jam.queue || [],
        revision: jam.revision || 0,
        admins: [],
        members: [],
        guests: [],
        active: []
      }
    })

    jamSessions.sort((a, b) => (b.startDate || 0) - (a.startDate || 0))
    console.log(`Found ${jamSessions.length} jam sessions for user ${b.userId}`)
    return jamSessions
  } catch (error) {
    console.error('Error getting user jam sessions:', error)
    return []
  }
}
