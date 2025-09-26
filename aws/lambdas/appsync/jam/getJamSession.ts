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

export const handler = async (event: any) => {
  console.log('getJamSession event:', JSON.stringify(event, null, 2));
  
  const { jamSessionId, userId } = event.arguments;
  
  if (!jamSessionId) {
    console.error('ERROR: jamSessionId is required');
    throw new Error('jamSessionId is required');
  }

  console.log('Getting jam session:', jamSessionId);
  console.log('User ID:', userId);

  // Debug: Log environment and configuration
  console.log('🔧 DEBUG: Environment Configuration:');
  console.log('  - AWS_REGION:', process.env.AWS_REGION || 'us-east-1 (default)');
  console.log('  - JAM_TABLE_NAME:', JAM_TABLE_NAME);
  console.log('  - jamSessionId type:', typeof jamSessionId);
  console.log('  - jamSessionId value:', JSON.stringify(jamSessionId));
  console.log('  - jamSessionId length:', jamSessionId?.length);

  // Debug: Log the exact DynamoDB query
  const dynamoQuery = {
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: jamSessionId } }
  };
  console.log('🔍 DEBUG: DynamoDB Query:', JSON.stringify(dynamoQuery, null, 2));

  // Get jam session from DynamoDB
  let res;
  try {
    res = await dynamo.send(new GetItemCommand(dynamoQuery));
    
    // Debug: Log the raw response
    console.log('📥 DEBUG: DynamoDB Response:');
    console.log('  - $metadata:', res.$metadata);
    console.log('  - Item exists:', !!res.Item);
    console.log('  - Raw Item:', res.Item ? JSON.stringify(res.Item, null, 2) : 'null');

  } catch (error) {
    console.error('💥 DEBUG: DynamoDB Error:', error);
    console.error('🔍 DEBUG: Error details:');
    if (error instanceof Error) {
      console.error('  - Error name:', error.name);
      console.error('  - Error message:', error.message);
    }
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('  - Error code:', (error as any).code);
    }
    throw error;
  }

  if (!res.Item) {
    console.error(`❌ ERROR: jamSessionId not found: ${jamSessionId}`);
    console.error('🔍 DEBUG: Possible causes:');
    console.error('  1. Wrong table name');
    console.error('  2. Wrong region');
    console.error('  3. Primary key name mismatch');
    console.error('  4. Data type mismatch (should be String)');
    console.error('  5. Case sensitivity');
    console.error('  6. Extra whitespace');
    console.error('  7. Permissions issue');
    throw new Error(`Jam session not found: ${jamSessionId}`);
  }

  console.log('✅ DEBUG: Item found successfully');
  const jamSession = unmarshall(res.Item) as JamSession;
  console.log('Jam session found:', jamSession);

  // Check if user has access to this jam session
  if (jamSession.policy === 'PRIVATE') {
    console.log('Checking private access for user:', userId);
    
    if (!userId) {
      console.error('ERROR: userId is required for private jam sessions');
      throw new Error('userId is required for private jam sessions');
    }

    // Check if user is admin, member, or guest (with null checks)
    const isAdmin = jamSession.admins && Array.isArray(jamSession.admins) ? 
      jamSession.admins.some(admin => admin && admin.userId === userId) : false;
    const isMember = jamSession.members && Array.isArray(jamSession.members) ? 
      jamSession.members.some(member => member && member.userId === userId) : false;
    const isGuest = jamSession.guests && Array.isArray(jamSession.guests) ? 
      jamSession.guests.some(guest => guest && guest.userId === userId) : false;

    // If no authorization arrays exist, check if user is the creator
    const isCreator = jamSession.userId === userId;

    if (!isAdmin && !isMember && !isGuest && !isCreator) {
      console.error(`ERROR: User ${userId} does not have access to private jam session ${jamSessionId}`);
      throw new Error(`User ${userId} does not have access to private jam session ${jamSessionId}`);
    }

    console.log('User has access to private jam session');
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
      // Don't throw an error, just skip setList resolution
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
        if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 
    
        const songs = res1.Responses![SONG_TABLE_NAME].map((u) => unmarshall(u) as Song)
        console.log(songs)

        // Convert to songCache format
        setList.songCache = songs
      } else if (setList.songCache && Array.isArray(setList.songCache)) {
        console.log("Found songCache in new format, using as is")
        // songCache already exists, use it
      } else {
        console.log("No songs found in setList, songCache will be null")
        setList.songCache = undefined
      }
    }

    jamSession.setList = setList
    }
  }

  return jamSession;
};