import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || 'oslynstudio-BandTable'
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable'
const TARGET_USER_ID = 'a8da4690-a3ae-4557-bb28-3764247325f8_usr'

async function testEfficientListBands() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🔍 Testing efficient listBands logic for user:', TARGET_USER_ID)
  
  try {
    // 1. Get user with bandMemberships (efficient single query!)
    console.log('\n📊 1. Getting user with bandMemberships...')
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
    console.log('📋 bandMemberships:', user.bandMemberships?.length || 0)
    if (user.bandMemberships) {
      console.log('📊 First membership sample:', user.bandMemberships[0])
    }
    
    if (!user.bandMemberships || user.bandMemberships.length === 0) {
      console.log('❌ No band memberships found')
      return
    }
    
    // 2. Extract unique bandIds from memberships
    const bandIds = [...new Set(user.bandMemberships.map((membership: any) => membership.bandId as string))] as string[]
    console.log('\n📊 2. Unique bandIds:', bandIds)
    
    // 3. Batch fetch band details
    console.log('\n📊 3. Batch fetching band details...')
    const bandPromises = bandIds.map(bandId => 
      dynamo.send(new GetItemCommand({
        TableName: BAND_TABLE_NAME,
        Key: { bandId: { S: bandId } }
      }))
    )
    
    const bandResults = await Promise.all(bandPromises)
    
    let bands = bandResults
      .filter(result => result.Item)
      .map(result => {
        let band = unmarshall(result.Item!) as any
        if (!band.songIds) band.songIds = []
        return band
      })
    
    console.log('✅ Fetched bands:', bands.length)
    bands.forEach((band, index) => {
      console.log(`   ${index + 1}. ${band.name} (${band.bandId})`)
    })
    
    // 4. Group memberships by bandId for efficient lookup
    console.log('\n📊 4. Grouping memberships by bandId...')
    const membershipsByBand = new Map<string, any[]>()
    user.bandMemberships.forEach((membership: any) => {
      if (!membershipsByBand.has(membership.bandId)) {
        membershipsByBand.set(membership.bandId, [])
      }
      membershipsByBand.get(membership.bandId)!.push(membership)
    })
    
    // 5. For each band, get members from the grouped memberships
    console.log('\n📊 5. Getting members for each band...')
    const bandMemberPromises = bands.map(async (band) => {
      console.log(`Getting members for band: ${band.bandId}`)
      
      const bandMemberships = membershipsByBand.get(band.bandId) || []
      console.log(`Found ${bandMemberships.length} memberships for band ${band.bandId}`)
      
      if (bandMemberships.length === 0) {
        return { bandId: band.bandId, members: [] }
      }
      
      // Get member details for all members of this band
      const memberIds = bandMemberships.map(membership => membership.userId)
      console.log(`Member IDs for band ${band.bandId}:`, memberIds)
      
      const memberPromises = memberIds.map(memberId => {
        console.log(`Fetching member: ${memberId}`)
        return dynamo.send(new GetItemCommand({
          TableName: USER_TABLE_NAME,
          Key: { userId: { S: memberId } }
        }))
      })
      
      const memberResults = await Promise.all(memberPromises)
      const members = memberResults
        .filter(result => result.Item)
        .map(result => {
          const member = unmarshall(result.Item!) as any
          return member
        })
      
      console.log(`Fetched ${members.length} member details for band ${band.bandId}`)
      return { bandId: band.bandId, members }
    })
    
    const bandMembersResults = await Promise.all(bandMemberPromises)
    
    // Map members to bands
    bands = bands.map(band => {
      const bandMembers = bandMembersResults.find(result => result.bandId === band.bandId)
      return { ...band, members: bandMembers?.members || [] }
    })
    
    console.log('\n📊 6. Final result:')
    bands.forEach((band, index) => {
      console.log(`   ${index + 1}. ${band.name}`)
      console.log(`      - Owner: ${band.userId}`)
      console.log(`      - Members: ${band.members.length}`)
      band.members.forEach((member: any, memberIndex: number) => {
        console.log(`        ${memberIndex + 1}. ${member.username} (${member.userId})`)
      })
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  testEfficientListBands()
    .then(() => {
      console.log('\nTest completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

export { testEfficientListBands }
