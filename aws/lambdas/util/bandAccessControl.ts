// Utility functions for band-based access control
import { DynamoDBClient, QueryCommand, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const USER_BAND_MEMBERSHIP_TABLE = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || ''
const BAND_SONG_TABLE = process.env.BAND_SONG_TABLE_NAME || ''
const BAND_SETLIST_TABLE = process.env.BAND_SETLIST_TABLE_NAME || ''

export interface BandMembership {
  userId: string
  bandId: string
  role: 'ADMIN' | 'MEMBER'
  joinedAt: number
}

export interface BandSong {
  bandId: string
  songId: string
  addedBy: string
  addedAt: number
}

export interface BandSetlist {
  bandId: string
  setlistId: string
  createdBy: string
  createdAt: number
}

/**
 * Get all bands a user belongs to - O(1) lookup
 */
export async function getUserBands(dynamo: DynamoDBClient, userId: string): Promise<BandMembership[]> {
  const result = await dynamo.send(new QueryCommand({
    TableName: USER_BAND_MEMBERSHIP_TABLE,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': { S: userId }
    }
  }))

  if (!result.Items) return []
  
  return result.Items.map(item => unmarshall(item) as BandMembership)
}

/**
 * Check if user has access to a specific band - O(1) lookup
 */
export async function hasBandAccess(dynamo: DynamoDBClient, userId: string, bandId: string): Promise<boolean> {
  const result = await dynamo.send(new QueryCommand({
    TableName: USER_BAND_MEMBERSHIP_TABLE,
    KeyConditionExpression: 'userId = :userId AND bandId = :bandId',
    ExpressionAttributeValues: {
      ':userId': { S: userId },
      ':bandId': { S: bandId }
    }
  }))

  return !!(result.Items && result.Items.length > 0)
}

/**
 * Get all songs accessible to a user through their bands - O(n) where n = number of user's bands
 */
export async function getUserAccessibleSongs(dynamo: DynamoDBClient, userId: string): Promise<BandSong[]> {
  // 1. Get user's bands - O(1)
  const userBands = await getUserBands(dynamo, userId)
  if (userBands.length === 0) return []

  // 2. Get songs from each band - O(n) where n = number of bands
  const bandSongPromises = userBands.map(band => 
    dynamo.send(new QueryCommand({
      TableName: BAND_SONG_TABLE,
      KeyConditionExpression: 'bandId = :bandId',
      ExpressionAttributeValues: {
        ':bandId': { S: band.bandId }
      }
    }))
  )

  const bandSongResults = await Promise.all(bandSongPromises)
  
  // 3. Flatten and return all accessible songs
  const allSongs: BandSong[] = []
  bandSongResults.forEach(result => {
    if (result.Items) {
      const songs = result.Items.map(item => unmarshall(item) as BandSong)
      allSongs.push(...songs)
    }
  })

  return allSongs
}

/**
 * Get all setlists accessible to a user through their bands - O(n) where n = number of user's bands
 */
export async function getUserAccessibleSetlists(dynamo: DynamoDBClient, userId: string): Promise<BandSetlist[]> {
  // 1. Get user's bands - O(1)
  const userBands = await getUserBands(dynamo, userId)
  if (userBands.length === 0) return []

  // 2. Get setlists from each band - O(n) where n = number of bands
  const bandSetlistPromises = userBands.map(band => 
    dynamo.send(new QueryCommand({
      TableName: BAND_SETLIST_TABLE,
      KeyConditionExpression: 'bandId = :bandId',
      ExpressionAttributeValues: {
        ':bandId': { S: band.bandId }
      }
    }))
  )

  const bandSetlistResults = await Promise.all(bandSetlistPromises)
  
  // 3. Flatten and return all accessible setlists
  const allSetlists: BandSetlist[] = []
  bandSetlistResults.forEach(result => {
    if (result.Items) {
      const setlists = result.Items.map(item => unmarshall(item) as BandSetlist)
      allSetlists.push(...setlists)
    }
  })

  return allSetlists
}

/**
 * Check if user has access to a specific song through any of their bands - O(n) where n = number of user's bands
 */
export async function hasSongAccess(dynamo: DynamoDBClient, userId: string, songId: string): Promise<boolean> {
  // 1. Get user's bands - O(1)
  const userBands = await getUserBands(dynamo, userId)
  if (userBands.length === 0) return false

  // 2. Check if song exists in any of user's bands - O(n) where n = number of bands
  const bandSongPromises = userBands.map(band => 
    dynamo.send(new QueryCommand({
      TableName: BAND_SONG_TABLE,
      KeyConditionExpression: 'bandId = :bandId AND songId = :songId',
      ExpressionAttributeValues: {
        ':bandId': { S: band.bandId },
        ':songId': { S: songId }
      }
    }))
  )

  const bandSongResults = await Promise.all(bandSongPromises)
  
  // 3. Return true if song found in any band
  return bandSongResults.some(result => result.Items && result.Items.length > 0)
}

/**
 * Check if user has access to a specific setlist through any of their bands - O(n) where n = number of user's bands
 */
export async function hasSetlistAccess(dynamo: DynamoDBClient, userId: string, setlistId: string): Promise<boolean> {
  // 1. Get user's bands - O(1)
  const userBands = await getUserBands(dynamo, userId)
  if (userBands.length === 0) return false

  // 2. Check if setlist exists in any of user's bands - O(n) where n = number of bands
  const bandSetlistPromises = userBands.map(band => 
    dynamo.send(new QueryCommand({
      TableName: BAND_SETLIST_TABLE,
      KeyConditionExpression: 'bandId = :bandId AND setlistId = :setlistId',
      ExpressionAttributeValues: {
        ':bandId': { S: band.bandId },
        ':setlistId': { S: setlistId }
      }
    }))
  )

  const bandSetlistResults = await Promise.all(bandSetlistPromises)
  
  // 3. Return true if setlist found in any band
  return bandSetlistResults.some(result => result.Items && result.Items.length > 0)
}

/**
 * Add user to band membership table
 */
export async function addUserToBand(
  dynamo: DynamoDBClient, 
  userId: string, 
  bandId: string, 
  role: 'ADMIN' | 'MEMBER'
): Promise<void> {
  await dynamo.send(new PutItemCommand({
    TableName: USER_BAND_MEMBERSHIP_TABLE,
    Item: {
      userId: { S: userId },
      bandId: { S: bandId },
      role: { S: role },
      joinedAt: { N: Date.now().toString() }
    }
  }))
}

/**
 * Add song to band's song collection
 */
export async function addSongToBand(
  dynamo: DynamoDBClient,
  bandId: string,
  songId: string,
  addedBy: string
): Promise<void> {
  await dynamo.send(new PutItemCommand({
    TableName: BAND_SONG_TABLE,
    Item: {
      bandId: { S: bandId },
      songId: { S: songId },
      addedBy: { S: addedBy },
      addedAt: { N: Date.now().toString() }
    }
  }))
}

/**
 * Add setlist to band's setlist collection
 */
export async function addSetlistToBand(
  dynamo: DynamoDBClient,
  bandId: string,
  setlistId: string,
  createdBy: string
): Promise<void> {
  await dynamo.send(new PutItemCommand({
    TableName: BAND_SETLIST_TABLE,
    Item: {
      bandId: { S: bandId },
      setlistId: { S: setlistId },
      createdBy: { S: createdBy },
      createdAt: { N: Date.now().toString() }
    }
  }))
}
