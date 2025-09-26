import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable'
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || 'oslynstudio-UserBandMembershipTable'
const TARGET_USER_ID = 'a8da4690-a3ae-4557-bb28-3764247325f8_usr'

async function checkUserBands() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🔍 Checking bands for user:', TARGET_USER_ID)
  
  try {
    // 1. Check User table bandIds
    console.log('\n📊 1. Checking User table bandIds...')
    const userRes = await dynamo.send(new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: TARGET_USER_ID } }
    }))
    
    if (!userRes.Item) {
      console.log('❌ User not found in User table')
      return
    }
    
    const user = unmarshall(userRes.Item)
    console.log('✅ User found:', user.username)
    console.log('📋 User bandIds:', user.bandIds)
    console.log('📋 User bandIds count:', user.bandIds?.length || 0)
    
    // 2. Check UserBandMembershipTable
    console.log('\n📊 2. Checking UserBandMembershipTable...')
    const membershipsRes = await dynamo.send(new QueryCommand({
      TableName: USER_BAND_MEMBERSHIP_TABLE_NAME,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': { S: TARGET_USER_ID }
      }
    }))
    
    if (!membershipsRes.Items || membershipsRes.Items.length === 0) {
      console.log('❌ No memberships found in UserBandMembershipTable')
      return
    }
    
    const memberships = membershipsRes.Items.map(item => unmarshall(item))
    console.log('✅ Found memberships:', memberships.length)
    memberships.forEach((membership, index) => {
      console.log(`   ${index + 1}. Band: ${membership.bandId}, Role: ${membership.role}`)
    })
    
    // 3. Compare the two
    console.log('\n📊 3. Comparison:')
    const userBandIds = user.bandIds || []
    const membershipBandIds = memberships.map(m => m.bandId)
    
    console.log('User table bandIds:', userBandIds)
    console.log('Membership table bandIds:', membershipBandIds)
    
    const missingInUser = membershipBandIds.filter((id: string) => !userBandIds.includes(id))
    const missingInMembership = userBandIds.filter((id: string) => !membershipBandIds.includes(id))
    
    if (missingInUser.length > 0) {
      console.log('⚠️  Missing in User table:', missingInUser)
    }
    if (missingInMembership.length > 0) {
      console.log('⚠️  Missing in Membership table:', missingInMembership)
    }
    
    if (missingInUser.length === 0 && missingInMembership.length === 0) {
      console.log('✅ Both tables are in sync')
    } else {
      console.log('❌ Tables are out of sync - this is the problem!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  checkUserBands()
    .then(() => {
      console.log('\nCheck completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Check failed:', error)
      process.exit(1)
    })
}

export { checkUserBands }
