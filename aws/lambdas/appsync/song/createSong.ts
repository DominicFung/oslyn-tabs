import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { updateDynamoUtil } from '../../util/dynamo'

import { v4 as uuidv4 } from 'uuid'
import { _Band } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  title: string, userId: string, chordSheetKey: string, chordSheet: string, 
  artist?: string, album?: string, albumCover?: string, shareWithBand?: string,
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.title) { console.error(`b.title is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }
  if (!b.chordSheetKey) { console.error(`b.chordSheetKey is empty`); return }
  if (!b.chordSheet) { console.error(`b.chordSheet is empty`); return }

  const dynamo = new DynamoDBClient({})
  const songId = uuidv4()

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.userId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: userId not found: ${b.userId}`); return }
  let song = {
    songId, title: b.title, 
    userId: b.userId,
    chordSheetKey: b.chordSheetKey,
    chordSheet: b.chordSheet,

    isApproved: true,
    version: 1,    
    recordings: []
  } as any

  if (b.album) song.album = b.album
  if (b.artist) song.artist = b.artist
  if (b.albumCover) song.albumCover = b.albumCover

  const res1 = await dynamo.send(
    new PutItemCommand({
      TableName: SONG_TABLE_NAME,
      Item: marshall(song)
    })
  )

  console.log(res1)
  console.log(`new song: ${JSON.stringify(song, null, 2)}`)
  song.creator = unmarshall(res0.Item)

  if (!song.editors) song.editors = []
  if (!song.viewers) song.viewers = []

  if (!song.creator.labelledRecording) song.creator.labelledRecording = []
  if (!song.creator.songsCreated) song.creator.songsCreated = []
  if (!song.creator.editHistory) song.creator.editHistory = []
  if (!song.creator.likedSongs) song.creator.likedSongs = []
  if (!song.creator.friendsIds) song.creator.friends = []

  if (b.shareWithBand) {
    const bandId = b.shareWithBand
    const res1 = await dynamo.send(
      new GetItemCommand({ TableName: BAND_TABLE_NAME, Key: { bandId: { S: bandId } } })
    )
    if (!res1.Item) { console.error(`ERROR: bandId not found ${bandId}`); return }
    let band = unmarshall(res1.Item) as _Band

    let songs = band.songIds || []
    if (!songs.includes(songId)) songs.push(songId)
    else return song // this is generally not possible

    console.log(`Adding ${songId} to ${bandId} 's songs ..`)
    const params = updateDynamoUtil({ table: BAND_TABLE_NAME, item: { songIds: songs }, key: { bandId: bandId } })
    const res2 = await dynamo.send(new UpdateItemCommand(params))
    console.log(res2)
  }
  
  return song
}