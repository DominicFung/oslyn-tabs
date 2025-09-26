import { DynamoDBClient, ScanCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable'
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || 'oslynstudio-UserBandMembershipTable'

interface BandMembership {
  bandId: string
  role: string
  joinedAt: number
}

interface UserBandMembership {
  userId: string
  bandId: string
  role: string
  joinedAt: number
}

async function migrateBandMemberships() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🚀 Starting migration from UserBandMembershipTable to User table...')
  
  try {
    // 1. Get all memberships from UserBandMembershipTable
    console.log('\n📊 1. Scanning UserBandMembershipTable...')
    const membershipsRes = await dynamo.send(new ScanCommand({
      TableName: USER_BAND_MEMBERSHIP_TABLE_NAME
    }))
    
    if (!membershipsRes.Items || membershipsRes.Items.length === 0) {
      console.log('❌ No memberships found in UserBandMembershipTable')
      return
    }
    
    const memberships = membershipsRes.Items.map(item => unmarshall(item) as UserBandMembership)
    console.log(`✅ Found ${memberships.length} memberships`)
    
    // 2. Group memberships by userId
    console.log('\n📊 2. Grouping memberships by userId...')
    const membershipsByUser = new Map<string, BandMembership[]>()
    
    for (const membership of memberships) {
      if (!membershipsByUser.has(membership.userId)) {
        membershipsByUser.set(membership.userId, [])
      }
      
      membershipsByUser.get(membership.userId)!.push({
        bandId: membership.bandId,
        role: membership.role,
        joinedAt: membership.joinedAt
      })
    }
    
    console.log(`✅ Grouped into ${membershipsByUser.size} users`)
    
    // 3. Update each user with their band memberships
    console.log('\n📊 3. Updating users with band memberships...')
    let successCount = 0
    let errorCount = 0
    
    for (const [userId, userMemberships] of membershipsByUser) {
      try {
        console.log(`Updating user ${userId} with ${userMemberships.length} memberships...`)
        
        // Check if user exists
        const userRes = await dynamo.send(new GetItemCommand({
          TableName: USER_TABLE_NAME,
          Key: { userId: { S: userId } }
        }))
        
        if (!userRes.Item) {
          console.log(`⚠️  User ${userId} not found in User table, skipping...`)
          errorCount++
          continue
        }
        
        // Update user with band memberships
        await dynamo.send(new UpdateItemCommand({
          TableName: USER_TABLE_NAME,
          Key: { userId: { S: userId } },
          UpdateExpression: 'SET bandMemberships = :bandMemberships',
          ExpressionAttributeValues: {
            ':bandMemberships': { L: userMemberships.map(membership => ({
              M: {
                bandId: { S: membership.bandId },
                role: { S: membership.role },
                joinedAt: { N: membership.joinedAt.toString() }
              }
            }))}
          }
        }))
        
        console.log(`✅ Updated user ${userId}`)
        successCount++
        
      } catch (error) {
        console.error(`❌ Error updating user ${userId}:`, error)
        errorCount++
      }
    }
    
    console.log('\n📊 4. Migration Summary:')
    console.log(`✅ Successfully updated: ${successCount} users`)
    console.log(`❌ Errors: ${errorCount} users`)
    console.log(`📋 Total memberships processed: ${memberships.length}`)
    
    // 4. Verify migration by checking a few users
    console.log('\n📊 5. Verification...')
    const sampleUsers = Array.from(membershipsByUser.keys()).slice(0, 3)
    
    for (const userId of sampleUsers) {
      const userRes = await dynamo.send(new GetItemCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId: { S: userId } }
      }))
      
      if (userRes.Item) {
        const user = unmarshall(userRes.Item)
        console.log(`User ${userId}:`)
        console.log(`  - bandIds: ${user.bandIds?.length || 0} bands`)
        console.log(`  - bandMemberships: ${user.bandMemberships?.length || 0} memberships`)
        if (user.bandMemberships) {
          user.bandMemberships.forEach((membership: BandMembership, index: number) => {
            console.log(`    ${index + 1}. ${membership.bandId} - ${membership.role}`)
          })
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run if this file is executed directly
if (require.main === module) {
  migrateBandMemberships()
    .then(() => {
      console.log('\n🎉 Migration completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error)
      process.exit(1)
    })
}

export { migrateBandMemberships }
