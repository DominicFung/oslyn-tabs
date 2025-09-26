import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable'

async function removeBandIdsColumn() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🚀 Starting removal of bandIds column from User table...')
  
  try {
    // 1. Scan all users to find those with bandIds
    console.log('📊 1. Scanning User table for users with bandIds...')
    let lastEvaluatedKey: any = undefined
    let totalUsers = 0
    let usersWithBandIds = 0
    
    do {
      const scanParams: any = {
        TableName: USER_TABLE_NAME,
        ProjectionExpression: 'userId, bandIds, bandMemberships'
      }
      
      if (lastEvaluatedKey) {
        scanParams.ExclusiveStartKey = lastEvaluatedKey
      }
      
      const scanResult = await dynamo.send(new ScanCommand(scanParams))
      
      if (scanResult.Items) {
        for (const item of scanResult.Items) {
          const user = unmarshall(item)
          totalUsers++
          
          if (user.bandIds && user.bandIds.length > 0) {
            usersWithBandIds++
            console.log(`Found user ${user.userId} with ${user.bandIds.length} bandIds`)
            
            // Remove bandIds from this user
            await dynamo.send(new UpdateItemCommand({
              TableName: USER_TABLE_NAME,
              Key: { userId: { S: user.userId } },
              UpdateExpression: 'REMOVE bandIds',
            }))
            
            console.log(`✅ Removed bandIds from user ${user.userId}`)
          }
        }
      }
      
      lastEvaluatedKey = scanResult.LastEvaluatedKey
    } while (lastEvaluatedKey)
    
    console.log('\n📊 2. Summary:')
    console.log(`✅ Total users scanned: ${totalUsers}`)
    console.log(`✅ Users with bandIds: ${usersWithBandIds}`)
    console.log(`✅ bandIds column removed from ${usersWithBandIds} users`)
    
    console.log('\n🎉 bandIds column removal completed successfully!')
    
  } catch (error) {
    console.error('❌ Error removing bandIds column:', error)
    throw error
  }
}

// Run if this file is executed directly
if (require.main === module) {
  removeBandIdsColumn()
    .then(() => {
      console.log('\nScript completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Script failed:', error)
      process.exit(1)
    })
}

export { removeBandIdsColumn }
