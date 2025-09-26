import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || 'oslynstudio-JamSessionTable'
const dynamo = new DynamoDBClient({})

async function debugJamSession(jamSessionId: string) {
  console.log('🔍 Debugging jam session:', jamSessionId)
  console.log('📋 Table:', JAM_TABLE_NAME)
  
  try {
    const result = await dynamo.send(new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: jamSessionId } }
    }))
    
    if (!result.Item) {
      console.log('❌ Jam session not found in DynamoDB')
      return
    }
    
    const jamSession = unmarshall(result.Item)
    console.log('✅ Jam session found in DynamoDB:')
    console.log('📊 Raw data:', JSON.stringify(jamSession, null, 2))
    console.log('📊 Keys:', Object.keys(jamSession))
    console.log('📊 setListId:', jamSession.setListId)
    console.log('📊 bandId:', jamSession.bandId)
    console.log('📊 policy:', jamSession.policy)
    console.log('📊 userId:', jamSession.userId)
    console.log('📊 queue:', jamSession.queue)
    console.log('📊 revision:', jamSession.revision)
    
  } catch (error) {
    console.error('❌ Error debugging jam session:', error)
  }
}

// Get jam session ID from command line arguments
const jamSessionId = process.argv[2]
if (!jamSessionId) {
  console.error('❌ Please provide jam session ID as argument')
  console.error('Usage: npx ts-node debug-jam-session.ts <jamSessionId>')
  process.exit(1)
}

debugJamSession(jamSessionId)
  .then(() => {
    console.log('✅ Debug complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Debug failed:', error)
    process.exit(1)
  })
