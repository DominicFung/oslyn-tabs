import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable'
const TARGET_USER_ID = 'a8da4690-a3ae-4557-bb28-3764247325f8_usr'

async function testBandMemberships() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🧪 Testing band memberships for user:', TARGET_USER_ID)
  
  try {
    // Get user data
    const userRes = await dynamo.send(new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: TARGET_USER_ID } }
    }))
    
    if (!userRes.Item) {
      console.log('❌ User not found')
      return
    }
    
    const user = unmarshall(userRes.Item)
    console.log('📊 User data:')
    console.log('  - userId:', user.userId)
    console.log('  - username:', user.username)
    console.log('  - bandIds (old):', user.bandIds)
    console.log('  - bandMemberships (new):', user.bandMemberships)
    
    if (user.bandMemberships && user.bandMemberships.length > 0) {
      console.log('✅ New bandMemberships field found!')
      user.bandMemberships.forEach((membership: any, index: number) => {
        console.log(`  ${index + 1}. Band: ${membership.bandId}, Role: ${membership.role}, Joined: ${new Date(membership.joinedAt).toISOString()}`)
      })
    } else {
      console.log('⚠️  No bandMemberships found, using old bandIds field')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testBandMemberships()
    .then(() => {
      console.log('Test completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

export { testBandMemberships }
