import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { _Band, _Song, _User } from '../../type'
import { hasSubstring, merge } from '../../util/dynamo'
import { User } from '../../API'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  bandId: string, userId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.bandId) { console.error(`b.bandId is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: BAND_TABLE_NAME,
      Key: { bandId: { S: b.bandId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: bandId not found: ${b.bandId}`)
    return 
  }

  let band = unmarshall(res0.Item) as _Band
  
  if (hasSubstring(event.info.selectionSetList, "owner")) {
    console.log("getting owner ...")
    const res1 = await dynamo.send(
      new GetItemCommand({TableName: USER_TABLE_NAME, Key: { userId: { S: band.userId } }})
    )

    if (!res1.Item) { console.error("ERROR: Could not find band owner."); return }
    const owner = unmarshall(res1.Item) as _User

    if (!owner.labelledRecording) owner.labelledRecording = []
    if (!owner.songsCreated) owner.songsCreated = []
    if (!owner.editHistory) owner.editHistory = []
    if (!owner.likedSongs) owner.likedSongs = []
    if (!owner.friends) owner.friends = []

    band.owner = owner
  }

  if (hasSubstring(event.info.selectionSetList, "songs") && band.songs) {
    console.log("getting songs ...")

    const songIds = band.songs.map((s) => (s! as _Song).songId )

    const uniq = [...new Set(songIds.flat(1))]
    console.log(uniq)

    const keys = uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[SONG_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return  } 
    
    let songs = res1.Responses![SONG_TABLE_NAME].map((s) => unmarshall(s)) as _Song[]
    console.log(songs)

    if (hasSubstring(event.info.selectionSetList, "song/creator")) {
      console.log("getting songs/../song/creator ..")

      const creatorIds = songs.map((s) => { return s.userId })
      const uniq = [...new Set(creatorIds)]
      
      const keys = uniq.map((s) => { return { userId: { S: s } } })
      const res2 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res2)
      if (!res2.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return }

      console.log(JSON.stringify(res2.Responses))
      const users = res2.Responses![USER_TABLE_NAME].map((s) => unmarshall(s)) as User[]
      console.log(users)

      songs = merge(songs, users, 'userId', 'creator')
      console.log(songs)

      songs = songs.map((s) => {
        if (!s.recordings) s.recordings = []
        if (!s.editors) s.editors = []
        if (!s.viewers) s.viewers = []
        return s
      })
    }

    band.songs = merge(band.songs, songs, 'songId', 'song')
  } else band.songs = []

  if (hasSubstring(event.info.selectionSetList, "sets")) {
    band.sets = [] // TODO
  }

  if (hasSubstring(event.info.selectionSetList, "members")) {
    band.members = [] // TODO
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    band.admins = [] // TODO
  }
  
  return band
}