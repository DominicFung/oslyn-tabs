// Import song from one band to another
import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'
import { addSongToBand, hasBandAccess, hasSongAccess } from '../../util/bandAccessControl'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  songId: string,
  fromBandId: string,
  toBandId: string,
  userId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.songId) { console.error(`b.songId is empty`); return }
  if (!b.fromBandId) { console.error(`b.fromBandId is empty`); return }
  if (!b.toBandId) { console.error(`b.toBandId is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  try {
    // 1. Verify user has access to both bands
    const hasFromBandAccess = await hasBandAccess(dynamo, b.userId, b.fromBandId)
    const hasToBandAccess = await hasBandAccess(dynamo, b.userId, b.toBandId)
    
    if (!hasFromBandAccess) {
      console.error(`User ${b.userId} does not have access to source band ${b.fromBandId}`)
      return null
    }
    
    if (!hasToBandAccess) {
      console.error(`User ${b.userId} does not have access to destination band ${b.toBandId}`)
      return null
    }

    // 2. Verify user has access to the song in the source band
    const hasSongAccessInSource = await hasSongAccess(dynamo, b.userId, b.songId)
    if (!hasSongAccessInSource) {
      console.error(`User ${b.userId} does not have access to song ${b.songId} in band ${b.fromBandId}`)
      return null
    }

    // 3. Get the song
    const res0 = await dynamo.send(
      new GetItemCommand({
        TableName: SONG_TABLE_NAME,
        Key: { songId: { S: b.songId } }
      })
    )
    if (!res0.Item) { 
      console.error(`ERROR: songId not found: ${b.songId}`); 
      return null 
    }

    const song = unmarshall(res0.Item)
    
    // 4. Check if song is already in destination band
    const hasSongInDestination = await hasSongAccess(dynamo, b.userId, b.songId)
    if (hasSongInDestination) {
      console.log(`Song ${b.songId} is already accessible in band ${b.toBandId}`)
      return song
    }

    // 5. Add song to destination band's song collection
    await addSongToBand(dynamo, b.toBandId, b.songId, b.userId)

    // 6. Update song's band associations
    const currentBandIds = song.bandIds || [song.bandId || b.fromBandId]
    if (!currentBandIds.includes(b.toBandId)) {
      currentBandIds.push(b.toBandId)
      
      const updateParams = updateDynamoUtil({ 
        table: SONG_TABLE_NAME, 
        item: { 
          bandIds: currentBandIds,
          // Update primary band if this is the first band
          bandId: song.bandId || b.toBandId
        }, 
        key: { songId: b.songId } 
      })
      await dynamo.send(new UpdateItemCommand(updateParams))
    }

    // 7. Update destination band's songIds array (for backward compatibility)
    const res1 = await dynamo.send(
      new GetItemCommand({
        TableName: BAND_TABLE_NAME,
        Key: { bandId: { S: b.toBandId } }
      })
    )
    if (res1.Item) {
      const band = unmarshall(res1.Item)
      let songIds = band.songIds || []
      if (!songIds.includes(b.songId)) {
        songIds.push(b.songId)
        
        const updateParams = updateDynamoUtil({ 
          table: BAND_TABLE_NAME, 
          item: { songIds }, 
          key: { bandId: b.toBandId } 
        })
        await dynamo.send(new UpdateItemCommand(updateParams))
      }
    }

    console.log(`Song ${b.songId} successfully imported from band ${b.fromBandId} to band ${b.toBandId}`)
    return song

  } catch (error) {
    console.error('Error in importSongToBand:', error)
    return null
  }
}