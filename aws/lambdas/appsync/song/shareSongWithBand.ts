import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { _Band, _Song, _User } from '../../type'
import { hasSubstring, merge, updateDynamoUtil } from '../../util/dynamo'
import { User } from '../../API'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, songId: string, bandId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.userId) { console.error(`b.userId is empty`); return }
  if (!b.songId) { console.error(`b.songId is empty`); return }
  if (!b.bandId) { console.error(`b.bandId is empty`); return }

  const dynamo = new DynamoDBClient({})

  // check if user owns this song
  const res0 = await dynamo.send(
    new GetItemCommand({ TableName: SONG_TABLE_NAME, Key: { songId: { S: b.songId } } })
  )

  if (!res0.Item) { console.error(`ERROR: songId not found ${b.songId}`); return }
  let song = unmarshall(res0.Item) as _Song

  let authorizedToShare = false
  if (song.userId === b.userId) { authorizedToShare = true }
  if (song.adminIds && song.adminIds.includes(b.userId)) { authorizedToShare = true }

  if (!authorizedToShare) { console.error(`ERROR: ${b.userId} is not authorized to share this song`); return }

  const res1 = await dynamo.send(
    new GetItemCommand({ TableName: BAND_TABLE_NAME, Key: { bandId: { S: b.bandId } } })
  )
  if (!res1.Item) { console.error(`ERROR: bandId not found ${b.bandId}`); return }
  let band = unmarshall(res1.Item) as _Band

  let songs = band.songIds || []
  if (!songs.includes(b.songId)) songs.push(b.songId)

  console.log(`Adding ${b.songId} to ${b.bandId} 's songs ..`)
  const params = updateDynamoUtil({ table: BAND_TABLE_NAME, item: { songIds: songs }, key: { bandId: b.bandId } })
  const res2 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res2)

  if (hasSubstring(event.info.selectionSetList, "songs")) {
    if (band.songIds && band.songIds.length > 0) {
      const uniq = [...new Set(band.songIds)]

      const keys = uniq.map((s) => { return { songId: { S: s } } as { [songId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[SONG_TABLE_NAME]: { Keys: keys }}
      }))

      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res1.$metadata}`); return }

      let songs = res1.Responses![SONG_TABLE_NAME].map((s) => unmarshall(s)) as _Song[]
      console.log(songs)

      // finding all creators ..
      if (hasSubstring(event.info.selectionSetList, "songs/creator")) {
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
        const users = res2.Responses![USER_TABLE_NAME].map((s) => {
          let user = unmarshall(s) as User
          user.friends = []
          return user
        }) as User[]
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

      band.songs = songs
    } else { band.songs = [] }
  }

  if (hasSubstring(event.info.selectionSetList, "sets")) {
    band.sets = [] // TODO
  }

  if (hasSubstring(event.info.selectionSetList, "members")) {
    band.members = [] // TODO
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    if (band.adminIds && band.adminIds.length > 0) {
      const uniq = [...new Set(band.adminIds)]
      const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))

      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  }
      
      band.admins = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u) as _User

        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })
    } else { band.admins = [] }
  }

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

  return band
}