// Migration script to populate new band-based access control tables
// Run this after deploying the new tables

import { DynamoDBClient, ScanCommand, PutItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const USER_BAND_MEMBERSHIP_TABLE = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || ''
const BAND_SONG_TABLE = process.env.BAND_SONG_TABLE_NAME || ''
const BAND_SETLIST_TABLE = process.env.BAND_SETLIST_TABLE_NAME || ''

export async function migrateToBandAccess() {
  const dynamo = new DynamoDBClient({})
  
  console.log('🚀 Starting migration to band-based access control...')

  try {
    // Step 1: Create a default band for each user and migrate their songs/setlists
    console.log('📊 Step 1: Creating default bands for users...')
    
    // Get all users
    const usersResult = await dynamo.send(new ScanCommand({
      TableName: process.env.USER_TABLE_NAME || '',
      ProjectionExpression: 'userId, username, email'
    }))

    if (!usersResult.Items) {
      console.log('No users found')
      return
    }

    const users = usersResult.Items.map(item => unmarshall(item))
    console.log(`Found ${users.length} users`)

    for (const user of users) {
      console.log(`Processing user: ${user.userId}`)
      
      // Create a default band for this user
      const defaultBandId = `${user.userId}_default_band`
      
      // Check if band already exists
      const bandExists = await dynamo.send(new QueryCommand({
        TableName: BAND_TABLE_NAME,
        KeyConditionExpression: 'bandId = :bandId',
        ExpressionAttributeValues: {
          ':bandId': { S: defaultBandId }
        }
      }))

      if (bandExists.Items && bandExists.Items.length > 0) {
        console.log(`Default band already exists for user ${user.userId}`)
        continue
      }

      // Create default band
      await dynamo.send(new PutItemCommand({
        TableName: BAND_TABLE_NAME,
        Item: marshall({
          bandId: defaultBandId,
          userId: user.userId,
          name: `${user.username || user.email}'s Band`,
          description: 'Default band for personal songs and setlists',
          policy: 'PRIVATE',
          songIds: [],
          setIds: [],
          adminIds: [user.userId],
          createdAt: Date.now()
        })
      }))

      // Add user to band membership
      await dynamo.send(new PutItemCommand({
        TableName: USER_BAND_MEMBERSHIP_TABLE,
        Item: marshall({
          userId: user.userId,
          bandId: defaultBandId,
          role: 'ADMIN',
          joinedAt: Date.now()
        })
      }))

      console.log(`Created default band ${defaultBandId} for user ${user.userId}`)
    }

    // Step 2: Migrate songs to band-based structure
    console.log('🎵 Step 2: Migrating songs to band-based structure...')
    
    const songsResult = await dynamo.send(new ScanCommand({
      TableName: SONG_TABLE_NAME,
      ProjectionExpression: 'songId, userId, title, artist, album, albumCover, chordSheet, chordSheetKey, isApproved, version, recordings'
    }))

    if (songsResult.Items) {
      const songs = songsResult.Items.map(item => unmarshall(item))
      console.log(`Found ${songs.length} songs to migrate`)

      for (const song of songs) {
        const defaultBandId = `${song.userId}_default_band`
        
        // Update song with band information
        await dynamo.send(new PutItemCommand({
          TableName: SONG_TABLE_NAME,
          Item: marshall({
            ...song,
            createdBy: song.userId,
            bandId: defaultBandId,
            bandIds: [defaultBandId]
          })
        }))

        // Add song to band's song collection
        await dynamo.send(new PutItemCommand({
          TableName: BAND_SONG_TABLE,
          Item: marshall({
            bandId: defaultBandId,
            songId: song.songId,
            addedBy: song.userId,
            addedAt: Date.now()
          })
        }))

        // Update band's songIds array
        const bandResult = await dynamo.send(new QueryCommand({
          TableName: BAND_TABLE_NAME,
          KeyConditionExpression: 'bandId = :bandId',
          ExpressionAttributeValues: {
            ':bandId': { S: defaultBandId }
          }
        }))

        if (bandResult.Items && bandResult.Items.length > 0) {
          const band = unmarshall(bandResult.Items[0])
          const songIds = band.songIds || []
          if (!songIds.includes(song.songId)) {
            songIds.push(song.songId)
            
            await dynamo.send(new PutItemCommand({
              TableName: BAND_TABLE_NAME,
              Item: marshall({
                ...band,
                songIds
              })
            }))
          }
        }

        console.log(`Migrated song ${song.songId} to band ${defaultBandId}`)
      }
    }

    // Step 3: Migrate setlists to band-based structure
    console.log('📋 Step 3: Migrating setlists to band-based structure...')
    
    const setlistsResult = await dynamo.send(new ScanCommand({
      TableName: SETLIST_TABLE_NAME,
      ProjectionExpression: 'setListId, userId, description, songs, editorIds'
    }))

    if (setlistsResult.Items) {
      const setlists = setlistsResult.Items.map(item => unmarshall(item))
      console.log(`Found ${setlists.length} setlists to migrate`)

      for (const setlist of setlists) {
        const defaultBandId = `${setlist.userId}_default_band`
        
        // Update setlist with band information
        await dynamo.send(new PutItemCommand({
          TableName: SETLIST_TABLE_NAME,
          Item: marshall({
            ...setlist,
            createdBy: setlist.userId,
            bandId: defaultBandId
          })
        }))

        // Add setlist to band's setlist collection
        await dynamo.send(new PutItemCommand({
          TableName: BAND_SETLIST_TABLE,
          Item: marshall({
            bandId: defaultBandId,
            setlistId: setlist.setListId,
            createdBy: setlist.userId,
            createdAt: Date.now()
          })
        }))

        // Update band's setIds array
        const bandResult = await dynamo.send(new QueryCommand({
          TableName: BAND_TABLE_NAME,
          KeyConditionExpression: 'bandId = :bandId',
          ExpressionAttributeValues: {
            ':bandId': { S: defaultBandId }
          }
        }))

        if (bandResult.Items && bandResult.Items.length > 0) {
          const band = unmarshall(bandResult.Items[0])
          const setIds = band.setIds || []
          if (!setIds.includes(setlist.setListId)) {
            setIds.push(setlist.setListId)
            
            await dynamo.send(new PutItemCommand({
              TableName: BAND_TABLE_NAME,
              Item: marshall({
                ...band,
                setIds
              })
            }))
          }
        }

        console.log(`Migrated setlist ${setlist.setListId} to band ${defaultBandId}`)
      }
    }

    console.log('✅ Migration completed successfully!')
    console.log('📊 Summary:')
    console.log(`  - Created ${users.length} default bands`)
    console.log(`  - Migrated ${songsResult.Items?.length || 0} songs`)
    console.log(`  - Migrated ${setlistsResult.Items?.length || 0} setlists`)

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateToBandAccess()
    .then(() => {
      console.log('Migration completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Migration failed:', error)
      process.exit(1)
    })
}
