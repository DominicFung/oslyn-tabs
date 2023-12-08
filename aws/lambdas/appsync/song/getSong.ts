import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring } from '../../util/dynamo'

import { _User, _Song, _Band } from '../../type'

const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  songId: string, userId: string, bandId?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.songId) { console.error(`b.songId is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: SONG_TABLE_NAME,
      Key: { songId: { S: b.songId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: songs for songId not found: ${b.songId}`); return }
  const song = unmarshall(res0.Item!) as _Song

  // check if user is either owner or editor
  let authorized = false
  if (song.userId === b.userId) authorized = true
  else if (song.editorIds && song.editorIds.includes(b.userId)) authorized = true
  else if (song.viewerIds && song.viewerIds.includes(b.userId)) authorized = true

  if (b.bandId) {
    const res0 = await dynamo.send(
      new GetItemCommand({
        TableName: BAND_TABLE_NAME,
        Key: { bandId: { S: b.bandId } }
      })
    )
    if (!res0.Item) { console.error(`ERROR: band for bandId not found: ${b.bandId}`); return }
    const band = unmarshall(res0.Item!) as _Band
    
    // either, this band is PUBLIC_VIEW / PUBLIC_JOIN and so you can SEE the song.
    // OR you are an admin of this band, PRIVATE
    if (band.policy === "PUBLIC_VIEW" || band.policy === "PUBLIC_JOIN") authorized = true
  }

  if (!authorized) { console.error("unauthorized"); return }

  if (hasSubstring(event.info.selectionSetList, "creator")) {
    const res1 = await dynamo.send(
      new GetItemCommand({
        TableName: USER_TABLE_NAME,
        Key: { userId: { S: song.userId } }
      })
    )
    if (!res1.Item) { console.error(`ERROR: user for userId not found: ${song.userId}`); return }
    
    song.creator = unmarshall(res1.Item) as _User
    if (!song.creator.labelledRecording) song.creator.labelledRecording = []
    if (!song.creator.songsCreated) song.creator.songsCreated = []
    if (!song.creator.editHistory) song.creator.editHistory = []
    if (!song.creator.likedSongs) song.creator.likedSongs = []
    if (!song.creator.friends) song.creator.friends = []
  }

  if (hasSubstring(event.info.selectionSetList, "editors")) {
    if (!song.editorIds) song.editors = []
    else {
      const uniq = [...new Set(song.editorIds)]
      const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))

      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  }
      
      song.editors = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u) as _User

        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })
    }
  }

  if (hasSubstring(event.info.selectionSetList, "viewers")) {
    if (!song.viewers) song.viewers = []
    else {
      const uniq = [...new Set(song.viewerIds)]
      const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))

      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  }
      
      song.viewers = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u) as _User

        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })
    }
  }

  return song
}