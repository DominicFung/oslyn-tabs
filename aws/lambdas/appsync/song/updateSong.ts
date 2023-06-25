import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'

import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'
import { Song, User } from '../../API'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

type _Song = Song & {
  userId: string
}

export const handler = async (event: AppSyncResolverEvent<{
  songId: string, 
  title?: string,
  songAuthor?: string,
  // 4/4 = 4, 6/8 = 6, 3/4 = 3, 2/4 = 2
  beat?: { count?: number, note?: number }
  approved?: boolean

  chordSheet?: string
  chordSheetKey?: string
  originPlatorm?: "UG" | "OTHER"
  originLink?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.songId) { console.error(`b.songId is empty`); return }

  const dynamo = new DynamoDBClient({})
  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: SONG_TABLE_NAME,
      Key: { songId: { S: b.songId } }
    })
  )
  
  if (!res0.Item) { console.error(`ERROR: songId not found: ${b.songId}`); return }
  
  const updateSong = {
    title: b.title, beat: b.beat, approved: b.approved,
    chordSheet: b.chordSheet, chordSheetKey: b.chordSheetKey, 
    originPlatorm: b.originPlatorm, originLink: b.originLink
  }

  const params = updateDynamoUtil({ table: SONG_TABLE_NAME, item: updateSong, key: { songId: b.songId } })
  const res1 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res1)

  let song = { ...(unmarshall(res0.Item) as _Song), ...updateSong } as _Song

  if (hasSubstring(event.info.selectionSetList, "creator")) {
    const res0 = await dynamo.send(
      new GetItemCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId: { S: song.userId } }
      })
    )
    console.log(res0)
    if (!res0.Item) { console.error(`ERROR: userId not found: ${song.userId}`); return }

    song.creator = unmarshall(res0.Item) as User

    if (!song.creator.labelledRecording) song.creator.labelledRecording = []
    if (!song.creator.songsCreated) song.creator.songsCreated = []
    if (!song.creator.editHistory) song.creator.editHistory = []
    if (!song.creator.likedSongs) song.creator.likedSongs = []
  }

  return song
}