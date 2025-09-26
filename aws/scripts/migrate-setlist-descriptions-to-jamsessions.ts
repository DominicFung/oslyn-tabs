import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || 'oslynstudio-JamSessionTable'
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || 'oslynstudio-SetListTable'

interface JamSession {
  jamSessionId: string
  setListId: string
  bandId?: string
  description?: string
}

interface SetList {
  setListId: string
  description: string
  bandId?: string
}

async function migrateSetListDescriptionsToJamSessions() {
  console.log('🚀 Starting migration of SetList descriptions to JamSessions...')
  console.log(`📊 JamSession Table: ${JAM_TABLE_NAME}`)
  console.log(`📊 SetList Table: ${SETLIST_TABLE_NAME}`)
  
  const dynamo = new DynamoDBClient({})
  
  try {
    // Step 1: Get all jam sessions
    console.log('\n🔍 Step 1: Scanning JamSession table...')
    const jamSessionsRes = await dynamo.send(new ScanCommand({
      TableName: JAM_TABLE_NAME,
      FilterExpression: 'attribute_exists(setListId)',
    }))
    
    if (!jamSessionsRes.Items || jamSessionsRes.Items.length === 0) {
      console.log('❌ No jam sessions found with setListId')
      return
    }
    
    const jamSessions = jamSessionsRes.Items.map(item => unmarshall(item) as JamSession)
    console.log(`✅ Found ${jamSessions.length} jam sessions`)
    
    // Step 2: Get all setlists
    console.log('\n🔍 Step 2: Scanning SetList table...')
    const setListsRes = await dynamo.send(new ScanCommand({
      TableName: SETLIST_TABLE_NAME,
    }))
    
    if (!setListsRes.Items || setListsRes.Items.length === 0) {
      console.log('❌ No setlists found')
      return
    }
    
    const setLists = setListsRes.Items.map(item => unmarshall(item) as SetList)
    console.log(`✅ Found ${setLists.length} setlists`)
    
    // Step 3: Create a map of setListId -> description
    const setListDescriptionMap = new Map<string, string>()
    setLists.forEach(setList => {
      if (setList.description) {
        setListDescriptionMap.set(setList.setListId, setList.description)
      }
    })
    console.log(`📋 Created description map with ${setListDescriptionMap.size} entries`)
    
    // Step 4: Update jam sessions with descriptions
    console.log('\n🔄 Step 3: Updating jam sessions with descriptions...')
    let updatedCount = 0
    let skippedCount = 0
    let errorCount = 0
    
    for (const jamSession of jamSessions) {
      try {
        // Skip if jam session already has a description
        if (jamSession.description) {
          console.log(`⏭️  Skipping ${jamSession.jamSessionId} - already has description: "${jamSession.description}"`)
          skippedCount++
          continue
        }
        
        // Get description from setlist
        const setListDescription = setListDescriptionMap.get(jamSession.setListId)
        if (!setListDescription) {
          console.log(`⚠️  No description found for setListId: ${jamSession.setListId} in jam session: ${jamSession.jamSessionId}`)
          skippedCount++
          continue
        }
        
        // Update jam session with description
        await dynamo.send(new UpdateItemCommand({
          TableName: JAM_TABLE_NAME,
          Key: { jamSessionId: { S: jamSession.jamSessionId } },
          UpdateExpression: 'SET description = :description',
          ExpressionAttributeValues: {
            ':description': { S: setListDescription }
          }
        }))
        
        console.log(`✅ Updated ${jamSession.jamSessionId} with description: "${setListDescription}"`)
        updatedCount++
        
      } catch (error) {
        console.error(`❌ Error updating jam session ${jamSession.jamSessionId}:`, error)
        errorCount++
      }
    }
    
    // Step 5: Summary
    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Successfully updated: ${updatedCount} jam sessions`)
    console.log(`   ⏭️  Skipped: ${skippedCount} jam sessions`)
    console.log(`   ❌ Errors: ${errorCount} jam sessions`)
    console.log(`   📊 Total processed: ${jamSessions.length} jam sessions`)
    
    if (updatedCount > 0) {
      console.log('\n🎉 Migration completed successfully!')
      console.log('💡 Jam sessions now have descriptions from their associated setlists.')
    } else {
      console.log('\n⚠️  No jam sessions were updated. This could mean:')
      console.log('   - All jam sessions already have descriptions')
      console.log('   - No matching setlists found for the jam sessions')
      console.log('   - Setlists don\'t have descriptions')
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run the migration
if (require.main === module) {
  migrateSetListDescriptionsToJamSessions()
    .then(() => {
      console.log('✅ Migration script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error)
      process.exit(1)
    })
}

export { migrateSetListDescriptionsToJamSessions }
