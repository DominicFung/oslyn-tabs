import { BatchGetItemCommand, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge, chunk } from '../../util/dynamo'

import { _JamSession, _SetList, _Song, _User } from '../../type'

import { AppSyncResolverEvent } from 'aws-lambda'
import { User } from '../../API'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{}, null>) => {
  console.log(event)
  const dynamo = new DynamoDBClient({})

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

  if (!res0) { console.log("ERROR: empty scan response"); return }
  if (res0.Items && res0.Items.length === 0) return []

  let sessions = res0.Items!.map(s => {
    let jam = unmarshall(s) as _JamSession
    if (!jam.activeIds) jam.activeIds = []
    return jam
  })

  // Debug: Log all sessions before sorting
  console.log('=== BEFORE SORTING ===')
  sessions.forEach((session, index) => {
    console.log(`${index}: ${session.jamSessionId} - startDate: ${session.startDate} (${new Date(session.startDate || 0).toISOString()})`)
  })

  // Sort by startDate (creation date) in descending order (most recent first)
  sessions.sort((a, b) => {
    const aDate = a.startDate || 0
    const bDate = b.startDate || 0
    console.log(`Comparing: ${a.jamSessionId} (${aDate}) vs ${b.jamSessionId} (${bDate})`)
    return bDate - aDate // Descending order (newest first)
  })
  
  // Debug: Log all sessions after sorting
  console.log('=== AFTER SORTING ===')
  sessions.forEach((session, index) => {
    console.log(`${index}: ${session.jamSessionId} - startDate: ${session.startDate} (${new Date(session.startDate || 0).toISOString()})`)
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
    let sets = res1.Responses![SETLIST_TABLE_NAME].map(s => unmarshall(s)) as _SetList[]

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
            console.log(`    ${songIndex + 1}. Song ID: ${song.songId}, Key: ${song.key || 'N/A'}`)
          })
          if (set.songs.length > 3) {
            console.log(`    ... and ${set.songs.length - 3} more songs`)
          }
        }
      })
  
      const keys = chunk(uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } }), 100)
      console.log(keys)

      let songs: _Song[] = []
  
      for (let i=0; i<keys.length; i++) {
        const res1 = await dynamo.send(new BatchGetItemCommand({
          RequestItems: {[SONG_TABLE_NAME]: { Keys: keys[i] }}
        }))
        console.log(res1)
        if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 
  
        songs.push(...res1.Responses![SONG_TABLE_NAME].map((s) => unmarshall(s)) as _Song[])
      }
      
      console.log('=== SONGS DATA DEBUG ===')
      console.log(`Loaded ${songs.length} songs from database`)
      songs.forEach((song, index) => {
        console.log(`\n--- Song ${index + 1}: ${song.songId} ---`)
        console.log(`  - Title: ${song.title || 'N/A'}`)
        console.log(`  - Artist: ${song.artist || 'N/A'}`)
        console.log(`  - Key: ${song.key || 'N/A'}`)
        console.log(`  - Chord Sheet Length: ${song.chordSheet?.length || 0} characters`)
        console.log(`  - Chord Sheet Key: ${song.chordSheetKey || 'N/A'}`)
        console.log(`  - User ID: ${song.userId}`)
        console.log(`  - Created: ${song.createdAt ? new Date(song.createdAt).toISOString() : 'N/A'}`)
        console.log(`  - Updated: ${song.updatedAt ? new Date(song.updatedAt).toISOString() : 'N/A'}`)
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
        const users = res2.Responses![USER_TABLE_NAME].map((s) => unmarshall(s)) as User[]
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
    sessions.map(s => { s.admins = [s.admins as unknown as User] }) // TODO. fix admin to admins
  }

  if (hasSubstring(event.info.selectionSetList, "members")) {
    sessions.map(s => { if (!s.members) s.members = [] })
  }

  if (hasSubstring(event.info.selectionSetList, "guests")) {
    sessions.map(s => { if (!s.guests) s.guests = [] })
  }

  return sessions
}