import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable'
const TARGET_USER_ID = 'a8da4690-a3ae-4557-bb28-3764247325f8_usr'

async function verifyUserMemberships() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🔍 Verifying user memberships for:', TARGET_USER_ID)
  
  try {
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
    console.log('📋 bandIds:', user.bandIds)
    console.log('📋 bandMemberships:', user.bandMemberships)
    
    if (user.bandMemberships) {
      console.log('\n📊 Band Memberships:')
      user.bandMemberships.forEach((membership: any, index: number) => {
        console.log(`  ${index + 1}. Band: ${membership.bandId}`)
        console.log(`     Role: ${membership.role}`)
        console.log(`     Joined: ${new Date(membership.joinedAt).toISOString()}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  verifyUserMemberships()
    .then(() => {
      console.log('\nVerification completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Verification failed:', error)
      process.exit(1)
    })
}

export { verifyUserMemberships }
