import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, QueryCommand, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { Logger } from '../../util/logger'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string
}, null>) => {
  Logger.debug('getUserJamSessions called with event:', JSON.stringify(event, null, 2))
  const b = event.arguments
  if (!b) { 
    Logger.error('event.arguments is empty'); 
    return [] 
  }
  if (!b.userId) { 
    Logger.error('b.userId is empty'); 
    return [] 
  }
  
  Logger.debug('Processing request for userId:', b.userId)
  Logger.debug('Environment variables:')
  Logger.debug('   - USER_TABLE_NAME:', USER_TABLE_NAME)
  Logger.debug('   - JAM_TABLE_NAME:', JAM_TABLE_NAME)
  Logger.debug('   - USER_BAND_MEMBERSHIP_TABLE_NAME:', USER_BAND_MEMBERSHIP_TABLE_NAME)
  
  const dynamo = new DynamoDBClient({})
  
  try {
    // 1. Get all bands the user is a member of
    Logger.debug('Step 1: Querying UserBandMembershipTable for user bands')
    Logger.debug('Query parameters:')
    Logger.debug('   - TableName:', USER_BAND_MEMBERSHIP_TABLE_NAME)
    Logger.debug('   - KeyConditionExpression: userId = :userId')
    Logger.debug('   - ExpressionAttributeValues: {":userId": {"S": "' + b.userId + '"}}')
    
    const userBandsRes = await dynamo.send(new QueryCommand({
      TableName: USER_BAND_MEMBERSHIP_TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: b.userId }
      }
    }))
    
    console.log('📥 [DEBUG] UserBandMembershipTable query result:')
    console.log('   - Items count:', userBandsRes.Items?.length || 0)
    console.log('   - Raw response:', JSON.stringify(userBandsRes, null, 2))
    
    if (!userBandsRes.Items || userBandsRes.Items.length === 0) {
      console.log('❌ [DEBUG] User is not a member of any bands')
      return []
    }
    
    const userBands = userBandsRes.Items.map(item => {
      const unmarshalled = unmarshall(item)
      console.log('📊 [DEBUG] Unmarshalled band membership:', unmarshalled)
      return unmarshalled.bandId
    })
    console.log('✅ [DEBUG] User bands found:', userBands)
    
    // 2. Get all jam sessions for these bands using a single scan with filter
    console.log('🔍 [DEBUG] Step 2: Getting jam sessions for all bands')
    const jamSessions = []
    
    if (userBands.length > 0) {
      // Use IN operator for better performance
      const bandIdValues = userBands.map(bandId => ({ S: bandId }))
      
      console.log('🔍 [DEBUG] Scan parameters:')
      console.log('   - TableName:', JAM_TABLE_NAME)
      console.log('   - FilterExpression: bandId IN (:bandId1, :bandId2, ...)')
      console.log('   - Band IDs:', userBands)
      
      // Build expression attribute values dynamically
      const expressionAttributeValues: { [key: string]: any } = {}
      const bandIdExpressions = userBands.map((_, index) => `:bandId${index}`)
      
      userBands.forEach((bandId, index) => {
        expressionAttributeValues[`:bandId${index}`] = { S: bandId }
      })
      
      const jamRes = await dynamo.send(new ScanCommand({
        TableName: JAM_TABLE_NAME,
        FilterExpression: `bandId IN (${bandIdExpressions.join(', ')})`,
        ExpressionAttributeValues: expressionAttributeValues
      }))
      
      console.log('📥 [DEBUG] JamSessionTable scan result:')
      console.log('   - Items count:', jamRes.Items?.length || 0)
      
      if (jamRes.Items) {
        const allJamSessions = jamRes.Items.map(item => {
          const jam = unmarshall(item)
          console.log('📊 [DEBUG] Unmarshalled jam session:', jam)
          return {
            jamSessionId: jam.jamSessionId,
            bandId: jam.bandId,
            policy: jam.policy,
            description: jam.description || null,
            startDate: jam.startDate,
            endDate: jam.endDate,
            queue: jam.queue || [],
            revision: jam.revision || 0,
            // Simplified data structure - no complex nested objects
            admins: [],
            members: [],
            guests: [],
            active: []
          }
        })
        console.log('✅ [DEBUG] Processed', allJamSessions.length, 'jam sessions total')
        jamSessions.push(...allJamSessions)
      }
    }
    
    // 3. Sort by start date (most recent first)
    console.log('🔍 [DEBUG] Step 3: Sorting jam sessions by start date')
    console.log('📊 [DEBUG] Jam sessions before sorting:')
    jamSessions.forEach((session, index) => {
      console.log(`   ${index}: ${session.jamSessionId} - startDate: ${session.startDate}`)
    })
    
    jamSessions.sort((a, b) => (b.startDate || 0) - (a.startDate || 0))
    
    console.log('📊 [DEBUG] Jam sessions after sorting:')
    jamSessions.forEach((session, index) => {
      console.log(`   ${index}: ${session.jamSessionId} - startDate: ${session.startDate}`)
    })
    
    console.log('✅ [DEBUG] Found', jamSessions.length, 'jam sessions for user', b.userId)
    console.log('✅ [DEBUG] Final result:', JSON.stringify(jamSessions, null, 2))
    return jamSessions
    
  } catch (error) {
    console.error('❌ [DEBUG] Error getting user jam sessions:', error)
    if (error instanceof Error) {
      console.error('❌ [DEBUG] Error stack:', error.stack)
    }
    return []
  }
}
