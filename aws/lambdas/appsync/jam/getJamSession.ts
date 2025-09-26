import { DynamoDBClient, GetItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { JamSession, SetList, Song } from '../../types';

// Utility functions
function hasSubstring(strings: string[], substring: string): boolean {
  return strings.some((str) => str.includes(substring));
}

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || 'oslynstudio-JamSessionTable';
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || 'oslynstudio-SetListTable';
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || 'oslynstudio-SongTable';
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || 'oslynstudio-BandTable';
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || 'oslynstudio-UserTable';

export const handler = async (event: any) => {
  console.log('getJamSession event:', JSON.stringify(event, null, 2));
  
  const { jamSessionId, userId } = event.arguments;
  
  if (!jamSessionId) {
    console.error('ERROR: jamSessionId is required');
    throw new Error('jamSessionId is required');
  }

  console.log('Getting jam session:', jamSessionId);
  console.log('User ID:', userId);

  // Get jam session from DynamoDB
  const dynamoQuery = {
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: jamSessionId } }
  };

  let res;
  try {
    res = await dynamo.send(new GetItemCommand(dynamoQuery));
  } catch (error) {
    console.error('💥 ERROR: DynamoDB Error:', error);
    throw error;
  }

  if (!res.Item) {
    console.error(`❌ ERROR: jamSessionId not found: ${jamSessionId}`);
    throw new Error(`Jam session not found: ${jamSessionId}`);
  }

  console.log('✅ DEBUG: Item found successfully');
  const jamSession = unmarshall(res.Item) as JamSession;
  
  // PHASE 1: CRITICAL - Initialize required non-nullable arrays immediately
  console.log('🔧 DEBUG: Initializing required non-nullable arrays...');
  if (!jamSession.admins) jamSession.admins = [];
  if (!jamSession.members) jamSession.members = [];
  if (!jamSession.guests) jamSession.guests = [];
  if (!jamSession.active) jamSession.active = [];
  if (!jamSession.queue) jamSession.queue = [];
  
  console.log('✅ DEBUG: Required arrays initialized');
  console.log('Jam session found:', jamSession);

  // COMPREHENSIVE ACCESS CONTROL CHECK
  if (jamSession.policy === 'PRIVATE') {
    console.log('🔒 DEBUG: Checking private access for user:', userId);
    
    if (!userId) {
      console.error('ERROR: userId is required for private jam sessions');
      throw new Error('userId is required for private jam sessions');
    }

    // Check if user is the creator FIRST (most common case)
    const isCreator = jamSession.userId === userId;
    console.log(`🏗️ DEBUG: Creator check - jamSession.userId: "${jamSession.userId}", userId: "${userId}", isCreator: ${isCreator}`);

    // Check via ID arrays (consistent with enterJam.ts logic)
    const adminIds = (jamSession as any).adminIds || [];
    const memberIds = (jamSession as any).memberIds || [];
    const guestIds = (jamSession as any).guestIds || [];
    
    const isAdminById = adminIds.includes(userId);
    const isMemberById = memberIds.includes(userId);
    const isGuestById = guestIds.includes(userId);

    // Check via User object arrays (legacy check)
    const isAdmin = jamSession.admins.some(admin => admin && admin.userId === userId);
    const isMember = jamSession.members.some(member => member && member.userId === userId);
    const isGuest = jamSession.guests.some(guest => guest && guest.userId === userId);

    // Check if user is a member of the associated band
    let isBandMember = false;
    if (jamSession.bandId) {
      console.log(`🎸 DEBUG: Checking band membership for bandId: "${jamSession.bandId}"`);
      try {
        // Check user's band memberships
        const userRes = await dynamo.send(new GetItemCommand({
          TableName: USER_TABLE_NAME,
          Key: { userId: { S: userId } }
        }));
        
        if (userRes.Item) {
          const user = unmarshall(userRes.Item);
          if (user.bandMemberships && Array.isArray(user.bandMemberships)) {
            const bandMembership = user.bandMemberships.find((membership: any) => 
              membership.bandId === jamSession.bandId
            );
            if (bandMembership) {
              isBandMember = true;
              console.log(`🎸 DEBUG: User has band membership: ${JSON.stringify(bandMembership)}`);
            }
          }
        }

        // Also check the band directly
        const bandRes = await dynamo.send(new GetItemCommand({
          TableName: BAND_TABLE_NAME,
          Key: { bandId: { S: jamSession.bandId } }
        }));
        
        if (bandRes.Item) {
          const band = unmarshall(bandRes.Item);
          const isBandCreator = band.userId === userId;
          const isBandAdmin = (band.adminIds || []).includes(userId);
          const isBandMemberCheck = (band.memberIds || []).includes(userId);
          
          if (isBandCreator || isBandAdmin || isBandMemberCheck) {
            isBandMember = true;
          }
          console.log(`🎸 DEBUG: Band access - creator: ${isBandCreator}, admin: ${isBandAdmin}, member: ${isBandMemberCheck}`);
        }
      } catch (error) {
        console.error(`🎸 ERROR: Failed to check band membership:`, error);
      }
    }

    // Allow access if user has ANY valid access path
    const hasAccess = isCreator || isAdmin || isMember || isGuest || 
                     isAdminById || isMemberById || isGuestById || isBandMember;

    if (!hasAccess) {
      console.error(`❌ ERROR: User ${userId} does not have access to private jam session ${jamSessionId}`);
      throw new Error(`User ${userId} does not have access to private jam session ${jamSessionId}`);
    }

    console.log('✅ DEBUG: User has access to private jam session');
  }

  // PHASE 2: Populate creator as admin if needed
  if (hasSubstring(event.info.selectionSetList, "admins") && jamSession.admins.length === 0 && jamSession.userId) {
    console.log('👑 DEBUG: Adding creator to admins array...');
    try {
      const creatorRes = await dynamo.send(new GetItemCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId: { S: jamSession.userId } }
      }));
      if (creatorRes.Item) {
        const creator = unmarshall(creatorRes.Item);
        // Initialize required user arrays
        if (!creator.friends) creator.friends = [];
        if (!creator.songsCreated) creator.songsCreated = [];
        if (!creator.labelledRecording) creator.labelledRecording = [];
        if (!creator.likedSongs) creator.likedSongs = [];
        jamSession.admins = [creator as any];
        console.log('✅ DEBUG: Creator added to admins array');
      }
    } catch (error) {
      console.error('❌ ERROR: Failed to fetch creator:', error);
    }
  }

  // Get setList if requested
  if (hasSubstring(event.info.selectionSetList, "setList")) {
    console.log("getting setList ...")
    console.log("jamSession.setListId:", jamSession.setListId)
    
    // Check if jamSession has setListId, if not, try to get it from the setList field
    let setListId = jamSession.setListId
    if (!setListId && jamSession.setList && jamSession.setList.setListId) {
      setListId = jamSession.setList.setListId
    }
    
    if (!setListId) {
      console.warn(`WARNING: No setListId found for jam session ${jamSessionId}, skipping setList resolution`);
      jamSession.setList = undefined;
    } else {
      const res2 = await dynamo.send(
        new GetItemCommand({
          TableName: SETLIST_TABLE_NAME,
          Key: { setListId: { S: setListId } }
        })
      )
      if (!res2.Item) { 
        console.error(`ERROR: setListId not found: ${setListId}`); 
        throw new Error(`SetList not found: ${setListId}`)
      }

      let setList = unmarshall(res2.Item) as SetList
      console.log('SetList found:', setList)

      // PHASE 3: Initialize required SetList arrays
      console.log('🔧 DEBUG: Initializing SetList required arrays...');
      if (!setList.editors) setList.editors = [];
      if (!setList.songs) setList.songs = [];

      // PHASE 4: Fix song resolution to prevent null Song objects
      if (hasSubstring(event.info.selectionSetList, "setList/songs") && setList.songs && setList.songs.length > 0) {
        console.log("�� DEBUG: Resolving songs for setList...");
        
        // Extract song IDs from JamSongs
        const songIds = setList.songs
          .map((jamSong: any) => jamSong?.songId)
          .filter(Boolean) as string[];
        
        console.log(`🎵 DEBUG: Found ${songIds.length} song IDs to resolve:`, songIds);
        
        if (songIds.length > 0) {
          const uniq = Array.from(new Set(songIds));
          const keys = uniq.map((songId) => ({ songId: { S: songId } }));
          
          try {
            const songRes = await dynamo.send(new BatchGetItemCommand({
              RequestItems: { [SONG_TABLE_NAME]: { Keys: keys } }
            }));
            
            if (songRes.Responses && songRes.Responses[SONG_TABLE_NAME]) {
              const songs = songRes.Responses[SONG_TABLE_NAME].map((item) => unmarshall(item) as Song);
              console.log(`🎵 DEBUG: Successfully resolved ${songs.length} songs`);
              
              // Map songs back to JamSongs, filtering out any that don't have valid songs
              setList.songs = setList.songs
                .map((jamSong: any) => {
                  const song = songs.find(s => s.songId === jamSong.songId);
                  if (song) {
                    return { ...jamSong, song };
                  } else {
                    console.warn(`⚠️ WARNING: Song not found for ID: ${jamSong.songId}, excluding from results`);
                    return null;
                  }
                })
                .filter(Boolean); // Remove null entries
              
              console.log(`🎵 DEBUG: Final setList has ${setList.songs.length} valid songs`);
            } else {
              console.error('❌ ERROR: No songs returned from batch query');
              setList.songs = []; // Ensure it's an empty array, not null
            }
          } catch (error) {
            console.error('❌ ERROR: Failed to resolve songs:', error);
            setList.songs = []; // Ensure it's an empty array on error
          }
        }
      }

      // Handle songCache if requested
      if (hasSubstring(event.info.selectionSetList, "setList/songCache")) {
        console.log("getting setList/songCache ..")
        
        // Check if setList has songs in the old format (JamSong array)
        if (setList.songs && Array.isArray(setList.songs)) {
          console.log("Found songs in old format, converting to songCache")
          const songIds = (setList.songs || []).map((s) => s?.songId).filter(Boolean) as string[]
          const uniq = Array.from(new Set(songIds))
      
          const keys = uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } })
          console.log(keys)
      
          const res1 = await dynamo.send(new BatchGetItemCommand({
            RequestItems: {[SONG_TABLE_NAME]: { Keys: keys }}
          }))
          console.log(res1)
          if (!res1.Responses) { 
            console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); 
            setList.songCache = [];
          } else {
            const songs = res1.Responses![SONG_TABLE_NAME].map((u) => unmarshall(u) as Song)
            console.log(songs)
            // Convert to songCache format
            setList.songCache = songs
          }
        } else if (setList.songCache && Array.isArray(setList.songCache)) {
          console.log("Found songCache in new format, using as is")
          // songCache already exists, use it
        } else {
          console.log("No songs found in setList, songCache will be empty array")
          setList.songCache = []
        }
      }

      jamSession.setList = setList
    }
  }

  // FINAL: Ensure all required fields are properly set before returning
  console.log('🔧 DEBUG: Final validation of required fields...');
  
  // Ensure required arrays are never null
  if (!jamSession.admins) jamSession.admins = [];
  if (!jamSession.members) jamSession.members = [];
  if (!jamSession.active) jamSession.active = [];
  if (!jamSession.queue) jamSession.queue = [];
  
  // Ensure setList fields are valid if setList exists
  if (jamSession.setList) {
    if (!jamSession.setList.editors) jamSession.setList.editors = [];
    if (!jamSession.setList.songs) jamSession.setList.songs = [];
    
    // Final validation: ensure all songs in setList are valid
    jamSession.setList.songs = jamSession.setList.songs.filter(jamSong => 
      jamSong && jamSong.song && jamSong.song.songId
    );
  }

  console.log('✅ DEBUG: All required fields validated and populated');
  return jamSession;
};
