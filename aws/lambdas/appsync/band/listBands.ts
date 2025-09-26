import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { _Band, _Song, _User } from '../../type'
import { hasSubstring, merge, multiMerge } from '../../util/dynamo'
import { User } from '../../API'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  const dynamo = new DynamoDBClient({})

  // 1. Get user with bandMemberships (efficient single query!)
  console.log('🔍 Getting user with bandMemberships for userId:', b.userId)
  const userRes = await dynamo.send(new GetItemCommand({
    TableName: USER_TABLE_NAME,
    Key: { userId: { S: b.userId } }
  }))

  if (!userRes.Item) {
    console.log(`User not found: ${b.userId}`)
    return []
  }

  const user = unmarshall(userRes.Item) as any
  console.log('📊 User data:', user)
  
  if (!user.bandMemberships || user.bandMemberships.length === 0) {
    console.log(`No band memberships found for userId: ${b.userId}`)
    return []
  }

  console.log('📊 User bandMemberships:', user.bandMemberships.length)

  // 2. Extract unique bandIds from memberships
  const bandIds = Array.from(new Set(user.bandMemberships.map((membership: any) => membership.bandId as string))) as string[]
  console.log('📊 Unique bandIds:', bandIds)

  // 3. Batch fetch band details
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

  console.log('📊 Fetched bands:', bands.length)
  if (bands.length === 0) { 
    console.log(`No bands found for user bandIds`); 
    return bands 
  }

  if (hasSubstring(event.info.selectionSetList, "owner")) {
    console.log("getting owners ...")
    
    // Get unique owner IDs from all bands
    const ownerIds = Array.from(new Set(bands.map(band => band.userId).filter(Boolean)))
    console.log('📊 Owner IDs to fetch:', ownerIds)
    
    if (ownerIds.length > 0) {
      const ownerPromises = ownerIds.map(ownerId => 
        dynamo.send(new GetItemCommand({
          TableName: USER_TABLE_NAME, 
          Key: { userId: { S: ownerId } }
        }))
      )
      
      const ownerResults = await Promise.all(ownerPromises)
      const owners = ownerResults
        .filter(result => result.Item)
        .map(result => {
          const owner = unmarshall(result.Item!) as _User
          if (!owner.labelledRecording) owner.labelledRecording = []
          if (!owner.songsCreated) owner.songsCreated = []
          if (!owner.editHistory) owner.editHistory = []
          if (!owner.likedSongs) owner.likedSongs = []
          if (!owner.friends) owner.friends = []
          return owner
        })
      
      console.log('📊 Fetched owners:', owners)
      
      // Map owners to bands
      bands = bands.map(band => {
        const owner = owners.find(o => o.userId === band.userId)
        return { ...band, owner }
      })
    }
  }
  
  if (hasSubstring(event.info.selectionSetList, "songs")) {
    console.log("getting songs ...")

    const songIds = bands.map((b) => { 
      let r = [] as string[]
      for (const k of b?.songIds!) { k && r.push(k)}
      return r as string[]
    })

    const uniq = Array.from(new Set(songIds.flat(1)))
    console.log(uniq)

    if (uniq && uniq.length > 0) {
      const keys = uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[SONG_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 
      
      let songs = res1.Responses![SONG_TABLE_NAME].map((s) => unmarshall(s)) as _Song[]
      console.log(songs)

      if (hasSubstring(event.info.selectionSetList, "songs/creator")) {
        console.log("getting songs/../song/creator ..")

        const creatorIds = songs.map((s) => { return s.userId })
        const uniq = Array.from(new Set(creatorIds))
        
        const keys = uniq.map((s) => { return { userId: { S: s } } })
        const res2 = await dynamo.send(new BatchGetItemCommand({
          RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
        }))
        console.log(res2)
        if (!res2.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return }

        console.log(JSON.stringify(res2.Responses))
        let users = res2.Responses![USER_TABLE_NAME].map((s) => unmarshall(s)) as User[]
        console.log(users)

        users = users.map((u) => {
          let user = u
          if (!user.friends) user.friends = []
          return user
        })

        songs = merge(songs, users, 'userId', 'creator')
        console.log(songs)

        songs = songs.map((s) => {
          if (!s.recordings) s.recordings = []
          if (!s.editors) s.editors = []
          if (!s.viewers) s.viewers = []
          return s
        })
      }

      bands = multiMerge(bands || [], songs, 'songIds', 'songId', 'songs')
      console.log(JSON.stringify(bands))
    } else { 
      console.log("NONE of this user's bands has songs, continue ..")
      for (let i=0; i<bands.length; i++) { bands[i].songs = [] }
    }
  }

  // TODO: sets
  if (hasSubstring(event.info.selectionSetList, "sets")) {
    bands = bands.map((e) => { return { ...e, sets: [] } })
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    console.log("getting admins (user) ...")

    const adminIds = bands.map((b) => { 
      let r = [] as string[]
      for (const k of b?.adminIds!) { k && r.push(k)}
      return r as string[]
    })

    const uniq = Array.from(new Set(adminIds.flat(1)))

    if (uniq && uniq.length > 0) {
      const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
      
      const users = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u)
        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })

      console.log(users)
      for (let i=0; i<bands.length; i++) {
        bands[i].admins = merge(bands[i].admins || [], users, 'userId', 'admin')
      }
    } else {
      console.log("NONE of this user's bands has admins, continue ..")
      for (let i=0; i<bands.length; i++) { bands[i].admins = [] }
    }
  }

  if (hasSubstring(event.info.selectionSetList, "members")) {
    console.log("getting members efficiently using batch queries ...")
    
    // For each band, query UserBandMembershipTable to get ALL members
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
          const member = unmarshall(result.Item!) as _User
          if (!member.labelledRecording) member.labelledRecording = []
          if (!member.songsCreated) member.songsCreated = []
          if (!member.editHistory) member.editHistory = []
          if (!member.likedSongs) member.likedSongs = []
          if (!member.friends) member.friends = []
          return member
        })
      
      console.log(`Fetched ${members.length} member details for band ${band.bandId}`)
      return { bandId: band.bandId, members }
    })
    
    const bandMembersResults = await Promise.all(bandMemberPromises)
    
  // Map members to bands and add userRole
  bands = bands.map(band => {
    const bandMembers = bandMembersResults.find(result => result.bandId === band.bandId)
    
    // Find user's role in this band
    const userMembership = user.bandMemberships.find((membership: any) => membership.bandId === band.bandId)
    const userRole = userMembership ? userMembership.role : 'UNKNOWN'
    
    return { 
      ...band, 
      members: bandMembers?.members || [],
      userRole: userRole
    }
  })
  }

  console.log(JSON.stringify(bands))
  return bands
}