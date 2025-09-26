import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || 'oslynstudio-UserBandMembershipTable'

async function checkMembershipData() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🔍 Checking UserBandMembershipTable data format...')
  
  try {
    const membershipsRes = await dynamo.send(new ScanCommand({
      TableName: USER_BAND_MEMBERSHIP_TABLE_NAME,
      Limit: 5 // Just check first 5 records
    }))
    
    if (!membershipsRes.Items || membershipsRes.Items.length === 0) {
      console.log('❌ No memberships found')
      return
    }
    
    console.log(`✅ Found ${membershipsRes.Items.length} sample memberships`)
    
    membershipsRes.Items.forEach((item, index) => {
      console.log(`\n📊 Sample ${index + 1}:`)
      console.log('Raw DynamoDB format:', JSON.stringify(item, null, 2))
      
      const membership = unmarshall(item)
      console.log('Unmarshalled:', membership)
      console.log('joinedAt type:', typeof membership.joinedAt)
      console.log('joinedAt value:', membership.joinedAt)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  checkMembershipData()
    .then(() => {
      console.log('\nCheck completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Check failed:', error)
      process.exit(1)
    })
}

export { checkMembershipData }
