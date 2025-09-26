// Updated listSongs resolver with band-based access control - v2
import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring } from '../../util/dynamo'
import { getUserAccessibleSongs } from '../../util/bandAccessControl'
import { _Song, _User } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, 
  bandId?: string,
  limit?: number,
  filter?: string,
  nextToken?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  try {
    let accessibleSongs: any[] = []

    if (b.bandId) {
      // If bandId provided, get songs from specific band
      const bandSongs = await getUserAccessibleSongs(dynamo, b.userId)
      accessibleSongs = bandSongs.filter(bs => bs.bandId === b.bandId)
    } else {
      // Get all accessible songs from all user's bands
      accessibleSongs = await getUserAccessibleSongs(dynamo, b.userId)
    }

    if (accessibleSongs.length === 0) {
      console.log(`No accessible songs found for userId: ${b.userId}`)
      return []
    }

    // Get unique song IDs
    const songIds = [...new Set(accessibleSongs.map(bs => bs.songId))]
    
    // Apply limit if provided
    const limitedSongIds = b.limit ? songIds.slice(0, b.limit) : songIds

    // Batch get songs from SongTable
    const keys = limitedSongIds.map(songId => ({ songId: { S: songId } }))
    const chunks = []
    for (let i = 0; i < keys.length; i += 100) {
      chunks.push(keys.slice(i, i + 100))
    }

    let allSongs: _Song[] = []
    for (const chunk of chunks) {
      const res = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {
          [SONG_TABLE_NAME]: { Keys: chunk }
        }
      }))

      if (res.Responses && res.Responses[SONG_TABLE_NAME]) {
        const songs = res.Responses[SONG_TABLE_NAME].map(item => unmarshall(item) as _Song)
        allSongs.push(...songs)
      }
    }

    // Apply filter if provided
    if (b.filter) {
      const filterLower = b.filter.toLowerCase()
      allSongs = allSongs.filter(song => 
        song.title.toLowerCase().includes(filterLower) ||
        (song.artist && song.artist.toLowerCase().includes(filterLower)) ||
        (song.album && song.album.toLowerCase().includes(filterLower))
      )
    }

    // Add band context to songs
    allSongs = allSongs.map(song => {
      const bandSongs = accessibleSongs.filter(bs => bs.songId === song.songId)
      return {
        ...song,
        bandIds: bandSongs.map(bs => bs.bandId),
        primaryBandId: bandSongs[0]?.bandId // Use first band as primary
      }
    })

    // Get creator information if requested
    if (hasSubstring(event.info.selectionSetList, "creator")) {
      const creatorIds = [...new Set(allSongs.map(song => song.userId))]
      const creatorKeys = creatorIds.map(userId => ({ userId: { S: userId } }))
      
      const creatorChunks = []
      for (let i = 0; i < creatorKeys.length; i += 100) {
        creatorChunks.push(creatorKeys.slice(i, i + 100))
      }

      let allCreators: _User[] = []
      for (const chunk of creatorChunks) {
        const res = await dynamo.send(new BatchGetItemCommand({
          RequestItems: {
            [USER_TABLE_NAME]: { Keys: chunk }
          }
        }))

        if (res.Responses && res.Responses[USER_TABLE_NAME]) {
          const creators = res.Responses[USER_TABLE_NAME].map(item => unmarshall(item) as _User)
          allCreators.push(...creators)
        }
      }

      // Merge creator data with songs
      allSongs = allSongs.map(song => {
        const creator = allCreators.find(c => c.userId === song.userId)
        return {
          ...song,
          creator: creator || song.creator
        }
      })
    }

    // Add default empty arrays for editors and viewers
    allSongs = allSongs.map(song => ({
      ...song,
      editors: song.editors || [],
      viewers: song.viewers || []
    }))

    console.log(`Found ${allSongs.length} accessible songs for userId: ${b.userId}`)
    return allSongs

  } catch (error) {
    console.error('Error in listSongs:', error)
    return []
  }
}