import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || 'oslynstudio-BandTable'
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable'
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || 'oslynstudio-UserBandMembershipTable'
const TARGET_USER_ID = 'a8da4690-a3ae-4557-bb28-3764247325f8_usr'

async function testListBands() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🔍 Testing listBands logic for user:', TARGET_USER_ID)
  
  try {
    // 1. Get user with bandIds
    console.log('\n📊 1. Getting user with bandIds...')
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
    console.log('📋 User bandIds:', user.bandIds)
    
    if (!user.bandIds || user.bandIds.length === 0) {
      console.log('❌ No bandIds found')
      return
    }
    
    // 2. Get band details
    console.log('\n📊 2. Getting band details...')
    const bandPromises = user.bandIds.map((bandId: string) => 
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
    
    // 3. Get members for each band
    console.log('\n📊 3. Getting members for each band...')
    const bandMemberPromises = bands.map(async (band) => {
      console.log(`Getting members for band: ${band.bandId}`)
      
      // Query UserBandMembershipTable for this band
      const membersRes = await dynamo.send(new QueryCommand({
        TableName: USER_BAND_MEMBERSHIP_TABLE_NAME,
        IndexName: 'bandId-index',
        KeyConditionExpression: 'bandId = :bandId',
        ExpressionAttributeValues: {
          ':bandId': { S: band.bandId }
        }
      }))
      
      if (!membersRes.Items || membersRes.Items.length === 0) {
        console.log(`No members found for band: ${band.bandId}`)
        return { bandId: band.bandId, members: [] }
      }
      
      const memberMemberships = membersRes.Items.map(item => unmarshall(item))
      const memberIds = memberMemberships.map(membership => membership.userId)
      
      console.log(`Found ${memberIds.length} members for band ${band.bandId}:`, memberIds)
      
      if (memberIds.length === 0) {
        return { bandId: band.bandId, members: [] }
      }
      
      // Get member details
      const memberPromises = memberIds.map(memberId => 
        dynamo.send(new GetItemCommand({
          TableName: USER_TABLE_NAME,
          Key: { userId: { S: memberId } }
        }))
      )
      
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
    
    console.log('\n📊 4. Final result:')
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
  testListBands()
    .then(() => {
      console.log('\nTest completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Test failed:', error)
      process.exit(1)
    })
}

export { testListBands }
