import { BatchGetItemCommand, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge, chunk } from '../../util/dynamo'

import { JamSessionData, SetListData, SongData, UserData, isJamSessionData, isSetListData, isSongData, isUserData } from '../../types'

import { AppSyncResolverEvent } from 'aws-lambda'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{}, null>) => {
  console.log('🔍 [DEBUG] listPublicJamSessions called with event:', JSON.stringify(event, null, 2))
  console.log('🔍 [DEBUG] Environment variables:')
  console.log('   - JAM_TABLE_NAME:', JAM_TABLE_NAME)
  console.log('   - SETLIST_TABLE_NAME:', SETLIST_TABLE_NAME)
  console.log('   - SONG_TABLE_NAME:', SONG_TABLE_NAME)
  console.log('   - USER_TABLE_NAME:', USER_TABLE_NAME)
  
  const dynamo = new DynamoDBClient({})

  console.log('🔍 [DEBUG] Step 1: Scanning JamSessionTable for PUBLIC sessions')
  console.log('🔍 [DEBUG] Scan parameters:')
  console.log('   - TableName:', JAM_TABLE_NAME)
  console.log('   - Select: ALL_ATTRIBUTES')
  console.log('   - ScanFilter: policy BEGINS_WITH "PUBLIC"')

  const res0 = await dynamo.send(
    new ScanCommand({
      TableName: JAM_TABLE_NAME,
      Select: "ALL_ATTRIBUTES",
      ScanFilter: {
        policy: { 
          AttributeValueList: [ { S: "PUBLIC" }],
          ComparisonOperator: "BEGINS_WITH"
        }
      }
    })
  )

  console.log('📥 [DEBUG] JamSessionTable scan result:')
  console.log('   - Items count:', res0.Items?.length || 0)
  console.log('   - Raw response:', JSON.stringify(res0, null, 2))

  if (!res0) { 
    console.log("❌ [DEBUG] ERROR: empty scan response"); 
    return 
  }
  if (res0.Items && res0.Items.length === 0) {
    console.log('❌ [DEBUG] No public jam sessions found')
    return []
  }

  console.log('🔍 [DEBUG] Step 2: Processing jam sessions')
  let sessions = res0.Items!.map(s => {
    const jam = unmarshall(s) as JamSessionData
    console.log('📊 [DEBUG] Unmarshalled jam session:', jam)
    if (!jam.active) jam.active = []
    if (!jam.queue) jam.queue = []
    if (jam.revision === undefined || jam.revision === null) jam.revision = 0
    return jam
  })

  console.log('📊 [DEBUG] Processed', sessions.length, 'jam sessions')
  console.log('🔍 [DEBUG] Step 3: Sorting sessions by startDate')
  console.log('📊 [DEBUG] Sessions before sorting:')
  sessions.forEach((session, index) => {
    console.log(`   ${index}: ${session.jamSessionId} - startDate: ${session.startDate} (${new Date(session.startDate || 0).toISOString()})`)
  })

  // Sort by startDate (creation date) in descending order (most recent first)
  console.log('🔍 [DEBUG] Starting sort operation...')
  sessions.sort((a, b) => {
    const aDate = a.startDate || 0
    const bDate = b.startDate || 0
    console.log(`🔍 [DEBUG] Comparing: ${a.jamSessionId} (${aDate}) vs ${b.jamSessionId} (${bDate})`)
    return bDate - aDate // Descending order (newest first)
  })
  
  console.log('📊 [DEBUG] Sessions after sorting:')
  sessions.forEach((session, index) => {
    console.log(`   ${index}: ${session.jamSessionId} - startDate: ${session.startDate} (${new Date(session.startDate || 0).toISOString()})`)
  })

  // Debug: Log detailed session data
  console.log('=== DETAILED SESSION DATA ===')
  sessions.forEach((session, index) => {
    console.log(`\n--- Session ${index + 1}: ${session.jamSessionId} ---`)
    console.log(`  - Description: ${session.description || 'N/A'}`)
    console.log(`  - Policy: ${session.policy}`)
    console.log(`  - Start Date: ${session.startDate} (${new Date(session.startDate || 0).toISOString()})`)
    console.log(`  - End Date: ${session.endDate || 'N/A'} ${session.endDate ? `(${new Date(session.endDate).toISOString()})` : ''}`)
    console.log(`  - Set List ID: ${session.setListId}`)
    console.log(`  - User ID: ${session.userId}`)
    console.log(`  - Current Song: ${session.currentSong || 0}`)
    console.log(`  - Current Page: ${session.currentPage || 0}`)
    console.log(`  - Active IDs: ${JSON.stringify(session.activeIds || [])}`)
    console.log(`  - Page Settings: ${JSON.stringify(session.pageSettings || {})}`)
  })
  
  console.log(`Sorted ${sessions.length} jam sessions by creation date (most recent first)`)
  if (sessions.length > 0) {
    console.log(`Most recent session: ${sessions[0].jamSessionId} created at ${new Date(sessions[0].startDate || 0).toISOString()}`)
    if (sessions.length > 1) {
      console.log(`Oldest session: ${sessions[sessions.length - 1].jamSessionId} created at ${new Date(sessions[sessions.length - 1].startDate || 0).toISOString()}`)
    }
  }

  if (hasSubstring(event.info.selectionSetList, "setList")) {
    console.log("getting setList ...")

    const setIds = sessions.map((s) => s.setListId)
    const uniq = [...new Set(setIds)]

    const keys = uniq
      .map((s) => { return { setListId: { S: s } } as { [setListId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[SETLIST_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet setListId. ${res1.$metadata}`); return }
    let sets = res1.Responses![SETLIST_TABLE_NAME].map(s => unmarshall(s) as SetListData)

    if (hasSubstring(event.info.selectionSetList, "setList/songs")) {
      console.log("getting songs ...")
  
      const songIds = sets.map((s) => { 
        let r = [] as string[]
        for (const k of s.songs) { k?.songId && r.push(k?.songId)}
        return r as string[]
      })
  
      const uniq = [...new Set(songIds.flat(1))]
      console.log('=== SETLIST SONGS DEBUG ===')
      console.log(`Found ${uniq.length} unique song IDs:`, uniq)
      
      // Log detailed setlist information
      sets.forEach((set, index) => {
        console.log(`\n--- SetList ${index + 1}: ${set.setListId} ---`)
        console.log(`  - Description: ${set.description || 'N/A'}`)
        console.log(`  - User ID: ${set.userId}`)
        console.log(`  - Songs Count: ${set.songs?.length || 0}`)
        if (set.songs && set.songs.length > 0) {
          console.log(`  - First 3 Songs:`)
          set.songs.slice(0, 3).forEach((song, songIndex) => {
            console.log(`    ${songIndex + 1}. Song ID: ${song?.song?.songId || 'N/A'}, Key: ${song?.key || 'N/A'}`)
          })
          if (set.songs.length > 3) {
            console.log(`    ... and ${set.songs.length - 3} more songs`)
          }
        }
      })
  
      const keys = chunk(uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } }), 100)
      console.log(keys)

      let songs: SongData[] = []
  
      for (let i=0; i<keys.length; i++) {
        const res1 = await dynamo.send(new BatchGetItemCommand({
          RequestItems: {[SONG_TABLE_NAME]: { Keys: keys[i] }}
        }))
        console.log(res1)
        if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 
  
        songs.push(...res1.Responses![SONG_TABLE_NAME].map((s) => unmarshall(s) as SongData))
      }
      
      console.log('=== SONGS DATA DEBUG ===')
      console.log(`Loaded ${songs.length} songs from database`)
      songs.forEach((song, index) => {
        console.log(`\n--- Song ${index + 1}: ${song.songId} ---`)
        console.log(`  - Title: ${song.title || 'N/A'}`)
        console.log(`  - Artist: ${song.artist || 'N/A'}`)
        console.log(`  - Chord Sheet Length: ${song.chordSheet?.length || 0} characters`)
        console.log(`  - Chord Sheet Key: ${song.chordSheetKey || 'N/A'}`)
        console.log(`  - User ID: ${song.userId}`)
      })
  
      if (hasSubstring(event.info.selectionSetList, "song/creator")) {
        console.log("getting songs/../song/creator ..")
  
        const creatorIds = songs.map((s) => { return s.userId })
        const uniq = [...new Set(creatorIds)]
        
        const keys = uniq.map((s) => { return { userId: { S: s } } })
        const res2 = await dynamo.send(new BatchGetItemCommand({
          RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
        }))
        console.log(res2)
        if (!res2.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return }
  
        console.log(JSON.stringify(res2.Responses))
        const users = res2.Responses![USER_TABLE_NAME].map((s) => unmarshall(s) as UserData)
        console.log(users)
  
        songs = merge(songs, users, 'userId', 'creator')
        console.log(songs)
  
        songs = songs.map((s) => {
          if (!s.recordings) s.recordings = []
          return s
        })
      }
      
      for (let i=0; i<sets.length; i++) {
        sets[i].songs = merge(sets[i].songs, songs, 'songId', 'song')
      }
    }

    if (hasSubstring(event.info.selectionSetList, "setList/creator")) {
      console.log("getting creator (user) ...")
  
      const setUsers = sets.map((s) => { return s.userId as string })
      const uniq = [...new Set(setUsers)]
  
      const keys = uniq
      .map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
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
      sets = merge(sets, users, 'userId', 'creator')
    }

    // TODO: editors
    if (hasSubstring(event.info.selectionSetList, "setList/editors")) {
      sets = sets.map((e) => { return { ...e, editors: [] } })
    }
    
    sessions = merge(sessions, sets, "setListId", "setList")
  }

  if (hasSubstring(event.info.selectionSetList, "active")) {
    console.log("getting active users ...")

    const userIds = sessions.map((b) => { 
      let r = [] as string[]
      for (const k of b?.activeIds!) { k && r.push(k)}
      return r as string[]
    })

    const uniq = [...new Set(userIds.flat(1))]

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
      for (let i=0; i<sessions.length; i++) {
        sessions[i].active = merge(sessions[i].activeIds!, users, 'userId', 'active')
      }
    } else {
      console.log("NONE of these sessions have active users, continue ..")
      for (let i=0; i<sessions.length; i++) { sessions[i].active = [] }
    }
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    // userId is automatically an admin
    const userIds = sessions.map( s => s.userId! ) as string[]
    const uniq = [...new Set(userIds)]

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
    sessions = merge(sessions, users, 'userId', 'admins') // this injects the single user .. we dont want that.
    sessions = sessions.map(s => ({ ...s, admins: [s.admins as unknown as User] })) // Fix: properly transform array
  }

  if (hasSubstring(event.info.selectionSetList, "members")) {
    console.log('🔍 [DEBUG] Setting empty members array for all sessions')
    sessions = sessions.map(s => ({ ...s, members: s.members || [] }))
  }

  if (hasSubstring(event.info.selectionSetList, "guests")) {
    console.log('🔍 [DEBUG] Setting empty guests array for all sessions')
    sessions = sessions.map(s => ({ ...s, guests: s.guests || [] }))
  }

  console.log('✅ [DEBUG] Final result:')
  console.log('   - Total sessions:', sessions.length)
  console.log('   - Sessions:', JSON.stringify(sessions, null, 2))
  
  return sessions
}