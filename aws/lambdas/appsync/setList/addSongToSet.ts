import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  setListId: string, songId: string, key: string
}, null>) => {
  console.log('🎵 ===== ADD SONG TO SET LAMBDA DEBUG =====')
  console.log('🎵 Full event:', JSON.stringify(event, null, 2))
  
  const b = event.arguments
  console.log('🎵 Arguments:', b)
  
  if (!b) { 
    console.error(`❌ event.arguments is empty`); 
    return 
  }

  if (!b.setListId) { 
    console.error(`❌ b.setListId is empty: ${b.setListId}`); 
    return 
  }
  if (!b.songId) { 
    console.error(`❌ b.songId is empty: ${b.songId}`); 
    return 
  }
  if (!b.key) { 
    console.error(`❌ b.key is empty: ${b.key}`); 
    return 
  }
  
  console.log('🎵 All arguments validated successfully')

  const dynamo = new DynamoDBClient({})
  console.log('🎵 Fetching setlist from DynamoDB...')
  console.log('🎵 Table name:', SETLIST_TABLE_NAME)
  console.log('🎵 Key:', { setListId: { S: b.setListId } })
  
  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: SETLIST_TABLE_NAME,
      Key: { setListId: { S: b.setListId } }
    })
  )
  
  console.log('🎵 Setlist query result:', res0)
  
  if (!res0.Item) { 
    console.error(`❌ ERROR: setListId not found: ${b.setListId}`); 
    return 
  }
  
  let setList = unmarshall(res0.Item)
  console.log('🎵 Unmarshalled setlist:', setList)
  
  if (!setList.createdBy) { 
    console.error(`❌ ERROR: setList.createdBy not found in unmarshall(setList): ${setList.createdBy}`); 
    return 
  }
  
  console.log('🎵 Setlist validation successful')

  console.log('🎵 Fetching song from DynamoDB...')
  console.log('🎵 Song table name:', SONG_TABLE_NAME)
  console.log('🎵 Song key:', { songId: { S: b.songId } })
  
  const res1 = await dynamo.send(
    new GetItemCommand({
      TableName: SONG_TABLE_NAME,
      Key: { songId: { S: b.songId } }
    })
  )
  
  console.log('🎵 Song query result:', res1)
  
  if (!res1.Item) { 
    console.error(`❌ ERROR: songId not found: ${b.songId}`); 
    return 
  }
  
  console.log('🎵 Song validation successful')

  const res2  = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: setList.createdBy } }
    })
  )
  if (!res2.Item) { console.error(`ERROR: setList.createdBy not found: ${setList.createdBy}`); return }
  const creator = unmarshall(res2.Item)
  
  // Get the current songs array and determine the next order
  let setListSongs = setList.songs as any[]
  console.log('🎵 Current setlist songs:', setListSongs)
  console.log('🎵 Current songs count:', setListSongs.length)
  
  // Check for duplicates - don't allow the same song to be added twice
  const existingSong = setListSongs.find((s: any) => s.songId === b.songId)
  if (existingSong) {
    console.log('⚠️ Song already exists in setlist:', existingSong)
    throw new Error(`Song ${b.songId} is already in the setlist`)
  }
  
  const nextOrder = setListSongs.length
  console.log('🎵 Next order will be:', nextOrder)
  
  // Create proper JamSong structure
  const jamSong = { 
    songId: b.songId, 
    key: b.key,
    order: nextOrder
  }
  
  console.log('🎵 New jamSong to add:', jamSong)
  
  setListSongs.push(jamSong)
  setList.songs = setListSongs
  
  console.log('🎵 Updated setlist songs:', setListSongs)
  console.log('🎵 Updated songs count:', setListSongs.length)

  console.log('🎵 Updating setlist in DynamoDB...')
  let params = updateDynamoUtil({ table: SETLIST_TABLE_NAME, item: { songs: setListSongs }, key: { setListId: setList.setListId }})
  console.log('🎵 Update params:', JSON.stringify(params, null, 2))
  
  const res3 = await dynamo.send( new UpdateItemCommand(params) )
  console.log('🎵 Update result:', res3)

  // If we need to return song data, fetch the songs
  console.log('🎵 Checking if songs need to be fetched...')
  console.log('🎵 Selection set list:', event.info.selectionSetList)
  console.log('🎵 Has songs substring:', hasSubstring(event.info.selectionSetList, "songs"))
  
  if (hasSubstring(event.info.selectionSetList, "songs")) {
    console.log('🎵 Fetching song data for response...')
    
    // Remove duplicate song IDs to avoid BatchGetItemCommand error
    const uniqueSongIds = [...new Set(setListSongs.map((jamSong: any) => jamSong.songId))]
    console.log('🎵 Unique song IDs:', uniqueSongIds)
    
    const songKeys = uniqueSongIds.map((songId: string) => ({ songId: { S: songId } }))
    console.log('🎵 Song keys to fetch:', songKeys)
    
    const songRes = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[SONG_TABLE_NAME]: { Keys: songKeys }}
    }))
    
    console.log('🎵 Song batch get result:', songRes)
    
    if (songRes.Responses && songRes.Responses[SONG_TABLE_NAME]) {
      const songs = songRes.Responses[SONG_TABLE_NAME].map((item: any) => unmarshall(item))
      console.log('🎵 Fetched songs:', songs)
      
      // Map songs to JamSong structure - only include fields requested in GraphQL query
      setList.songs = setListSongs.map((jamSong: any) => {
        const song = songs.find((s: any) => s.songId === jamSong.songId)
        console.log(`🎵 Mapping jamSong ${jamSong.songId} to song:`, song)
        
        // Only return the fields requested in the GraphQL query
        const filteredSong = song ? {
          songId: song.songId,
          title: song.title,
          artist: song.artist,
          album: song.album,
          albumCover: song.albumCover,
          chordSheet: song.chordSheet,
          chordSheetKey: song.chordSheetKey,
          isApproved: song.isApproved,
          version: song.version
        } : null
        
        return {
          key: jamSong.key,
          order: jamSong.order,
          song: filteredSong
        }
      })
      
      console.log('🎵 Final mapped songs:', setList.songs)
    } else {
      console.log('❌ No song responses found')
    }
  }
  
  if (hasSubstring(event.info.selectionSetList, "creator")) { 
    console.log('🎵 Adding creator to response')
    setList.creator = [creator] 
  }
  if (hasSubstring(event.info.selectionSetList, "editors")) { 
    console.log('🎵 Adding editors to response')
    const keys = setList.editorIds.map((s: string) => { return {userId: s} as { [userId: string]: any } })
    const res2 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
    }))
    console.log('🎵 Editors batch get result:', res2)
    if (!res2.Responses) { console.error(`❌ ERROR: unable to BatchGet editors. ${res2.$metadata}`); return  } 

    const editors = res2.Responses![USER_TABLE_NAME]
    setList.editors = editors
  }
  
  console.log('🎵 ===== FINAL RESPONSE =====')
  console.log('🎵 Returning setlist:', JSON.stringify(setList, null, 2))
  
  // Return only the fields that the SetList model expects
  const responseSetList = {
    setListId: setList.setListId,
    description: setList.description,
    bandId: setList.bandId,
    songs: setList.songs
    // Note: editors field is optional and we don't return it from this mutation
  }
  
  console.log('🎵 Filtered response:', JSON.stringify(responseSetList, null, 2))
  return responseSetList
}