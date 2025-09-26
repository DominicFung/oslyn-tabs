import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || 'oslynstudio-JamSessionTable'
const dynamo = new DynamoDBClient({})

interface JamSession {
  jamSessionId: string
  setListId?: string
  bandId?: string
  userId?: string
  policy?: string
  description?: string
  startDate?: number
  endDate?: number
  queue?: number[]
  revision?: number
  currentSong?: number
  currentPage?: number
  pin?: string
  active?: any[]
  admins?: any[]
  members?: any[]
  guests?: any[]
  pageSettings?: any
  setList?: any
}

async function fixJamSessionsBandId() {
  console.log('🔧 Starting jam sessions bandId fix...')
  console.log('📋 Table:', JAM_TABLE_NAME)
  
  try {
    // Scan all jam sessions
    const scanResult = await dynamo.send(new ScanCommand({
      TableName: JAM_TABLE_NAME,
      FilterExpression: 'attribute_exists(jamSessionId) AND NOT attribute_exists(bandId)',
      ProjectionExpression: 'jamSessionId, setListId, userId, policy, description, startDate, endDate, queue, revision, currentSong, currentPage, pin, active, admins, members, guests, pageSettings, setList'
    }))
    
    console.log(`📊 Found ${scanResult.Items?.length || 0} jam sessions missing bandId`)
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      console.log('✅ No jam sessions need fixing')
      return
    }
    
    let fixedCount = 0
    let errorCount = 0
    
    for (const item of scanResult.Items) {
      try {
        const jamSession = unmarshall(item) as JamSession
        console.log(`🔧 Fixing jam session: ${jamSession.jamSessionId}`)
        
        // Set a default bandId - you might want to derive this from setListId or userId
        // For now, using a placeholder that indicates it needs manual review
        const defaultBandId = `temp-band-${jamSession.userId || 'unknown'}`
        
        await dynamo.send(new UpdateItemCommand({
          TableName: JAM_TABLE_NAME,
          Key: { jamSessionId: { S: jamSession.jamSessionId } },
          UpdateExpression: 'SET bandId = :bandId',
          ExpressionAttributeValues: {
            ':bandId': { S: defaultBandId }
          }
        }))
        
        console.log(`✅ Fixed jam session ${jamSession.jamSessionId} with bandId: ${defaultBandId}`)
        fixedCount++
        
      } catch (error) {
        console.error(`❌ Error fixing jam session ${item.jamSessionId}:`, error)
        errorCount++
      }
    }
    
    console.log(`🎉 Migration complete!`)
    console.log(`   - Fixed: ${fixedCount}`)
    console.log(`   - Errors: ${errorCount}`)
    console.log(`   - Total processed: ${scanResult.Items.length}`)
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run the migration
fixJamSessionsBandId()
  .then(() => {
    console.log('✅ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Migration script failed:', error)
    process.exit(1)
  })
