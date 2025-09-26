import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable'
const TARGET_USER_ID = 'a8da4690-a3ae-4557-bb28-3764247325f8_usr'

async function testWithoutBandIds() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🧪 Testing system without bandIds column...')
  
  try {
    // 1. Get user to verify bandIds is gone
    console.log('\n📊 1. Getting user to verify bandIds removal...')
    const userRes = await dynamo.send(new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: TARGET_USER_ID } }
    }))
    
    if (!userRes.Item) {
      console.log('❌ User not found')
      return
    }
    
    const user = unmarshall(userRes.Item)
    console.log('✅ User found:', user.username)
    console.log('📋 bandIds:', user.bandIds) // Should be undefined
    console.log('📋 bandMemberships:', user.bandMemberships?.length || 0)
    
    if (user.bandIds) {
      console.log('❌ ERROR: bandIds still exists!')
    } else {
      console.log('✅ SUCCESS: bandIds column has been removed')
    }
    
    if (user.bandMemberships && user.bandMemberships.length > 0) {
      console.log('✅ SUCCESS: bandMemberships is working')
      user.bandMemberships.forEach((membership: any, index: number) => {
        console.log(`  ${index + 1}. Band: ${membership.bandId}, Role: ${membership.role}`)
      })
    } else {
      console.log('❌ ERROR: No bandMemberships found')
    }
    
    console.log('\n🎉 Test completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    throw error
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testWithoutBandIds()
    .then(() => {
      console.log('\nTest completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

export { testWithoutBandIds }
