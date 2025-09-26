import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string
  description: string
}, null>) => {
  console.log('🔍 [DEBUG] updateJamSessionDescription called with event:', JSON.stringify(event, null, 2))
  const b = event.arguments
  if (!b) { 
    console.error('❌ [DEBUG] event.arguments is empty'); 
    return null
  }
  if (!b.jamSessionId) { 
    console.error('❌ [DEBUG] b.jamSessionId is empty'); 
    return null
  }
  if (!b.description) { 
    console.error('❌ [DEBUG] b.description is empty'); 
    return null
  }
  
  console.log('🔍 [DEBUG] Processing request for jamSessionId:', b.jamSessionId)
  console.log('🔍 [DEBUG] New description:', b.description)
  console.log('🔍 [DEBUG] Environment variables:')
  console.log('   - JAM_TABLE_NAME:', JAM_TABLE_NAME)
  
  const dynamo = new DynamoDBClient({})
  
  try {
    // 1. Get the current jam session
    console.log('🔍 [DEBUG] Step 1: Getting current jam session')
    const getRes = await dynamo.send(new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } }
    }))
    
    if (!getRes.Item) {
      console.error('❌ [DEBUG] Jam session not found:', b.jamSessionId)
      return null
    }
    
    const currentJam = unmarshall(getRes.Item)
    console.log('📊 [DEBUG] Current jam session:', currentJam)
    
    // 2. Update the description
    console.log('🔍 [DEBUG] Step 2: Updating jam session description')
    const updateRes = await dynamo.send(new UpdateItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } },
      UpdateExpression: 'SET description = :description',
      ExpressionAttributeValues: {
        ':description': { S: b.description }
      },
      ReturnValues: 'ALL_NEW'
    }))
    
    if (!updateRes.Attributes) {
      console.error('❌ [DEBUG] Failed to update jam session')
      return null
    }
    
    const updatedJam = unmarshall(updateRes.Attributes)
    console.log('✅ [DEBUG] Successfully updated jam session description')
    console.log('📊 [DEBUG] Updated jam session:', updatedJam)
    
    return updatedJam
    
  } catch (error) {
    console.error('❌ [DEBUG] Error updating jam session description:', error)
    if (error instanceof Error) {
      console.error('❌ [DEBUG] Error stack:', error.stack)
    }
    return null
  }
}
