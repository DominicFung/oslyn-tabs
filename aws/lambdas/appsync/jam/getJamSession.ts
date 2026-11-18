import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, BatchGetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { hasSubstring, merge } from '../../util/dynamo'
import { batchGetAll } from '../../util/batch'
import { canEditJamSongs, canJoinJam, joinTokenMatches, memberIdsWith } from '../../util/jamAccess'
import { asPlaylist } from '../../util/songIndex'

import { Participant, User } from '../../API'
import { _JamSession, _JamSong, _SetList } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, userId?: string, bandId?: string, joinToken?: string | null
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.setListId is empty`); return }
  if (b.bandId) console.log(`getJamSession bandId hint ${b.bandId}`)
  
  const dynamo = new DynamoDBClient({})
  const res1 = await dynamo.send(
    new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } }
    })
  )
  if (!res1.Item) { console.error(`ERROR: jamSessionId not found: ${b.jamSessionId}`); return }
  let jamSession = unmarshall(res1.Item) as _JamSession

  if (!canJoinJam(jamSession, b.userId, b.joinToken)) {
    console.error(`This is a private jam session.`)
    return
  }
  if (b.userId && joinTokenMatches(jamSession, b.joinToken)) {
    const memberIds = memberIdsWith(jamSession, b.userId)
    if (memberIds) {
      await dynamo.send(new UpdateItemCommand({
        TableName: JAM_TABLE_NAME,
        Key: { jamSessionId: { S: b.jamSessionId } },
        UpdateExpression: 'SET memberIds = :members',
        ExpressionAttributeValues: marshall({ ':members': memberIds }),
      }))
      jamSession.memberIds = memberIds
    }
  }
  ;(jamSession as _JamSession & { hostId?: string, canEditSongs?: boolean }).hostId = jamSession.userId
  ;(jamSession as _JamSession & { canEditSongs?: boolean }).canEditSongs = canEditJamSongs(jamSession, b.userId)

  if (hasSubstring(event.info.selectionSetList, "setList")) {
    console.log("getting setList ...")
    const res2 = await dynamo.send(
      new GetItemCommand({
        TableName: SETLIST_TABLE_NAME,
        Key: { setListId: { S: jamSession.setListId } }
      })
    )
    if (!res2.Item) { console.error(`ERROR: setListId not found: ${jamSession.setListId}`); return }

    let setList = unmarshall(res2.Item) as _SetList
    console.log(setList)

    if (hasSubstring(event.info.selectionSetList, "setList/songs")) {
      console.log("getting setList/songs ..")
      const setSongs = Array.isArray(setList.songs) ? setList.songs as _JamSong[] : []
      const playlist = Array.isArray((jamSession as _JamSession & { playlist?: unknown }).playlist)
        ? asPlaylist((jamSession as _JamSession & { playlist?: unknown }).playlist)
        : null
      const rawSongs = playlist
        ? playlist.map((row) => ({ songId: row.songId, key: row.key || 'C' })) as _JamSong[]
        : setSongs
      setList.songs = rawSongs
      const songIds = rawSongs.map((s) => s?.songId).filter((id): id is string => !!id)
      const uniq = [...new Set(songIds)]

      if (uniq.length > 0) {
        const rows = await batchGetAll(
          dynamo,
          SONG_TABLE_NAME,
          uniq.map((s) => ({ songId: { S: s } }))
        )
        const songs = rows.map((u) => unmarshall(u))
        console.log(songs)
        setList.songs = merge(rawSongs, songs, 'songId', 'song')
      }
    }

    if (hasSubstring(event.info.selectionSetList, "setList/creator")) {
      console.log("getting setList/creator ..")
      const res2 = await dynamo.send(new GetItemCommand({
        TableName: USER_TABLE_NAME, Key: { userId: { S: setList.userId } }
      }))
      console.log(res2)
      if (!res2.Item) { console.error(`ERROR: unable to get setList.userId. ${res1.$metadata}`); return  }
      let creator = unmarshall(res2.Item) as User

      if (!creator.labelledRecording) creator.labelledRecording = []
      if (!creator.songsCreated) creator.songsCreated = []
      if (!creator.likedSongs) creator.likedSongs = []
      if (!creator.friends) creator.friends = []
      
      setList.creator = creator
    }

    // TODO: editors
    if (hasSubstring(event.info.selectionSetList, "setList/editors")) {
      setList.editors = []
    }
    
    jamSession.setList = setList
  }

  if (hasSubstring(event.info.selectionSetList, "admin")) {
    jamSession.admins = [] as User[]
  }

  // TODO: members
  if (hasSubstring(event.info.selectionSetList, "members")) {
    jamSession.members = []
  }

  if (hasSubstring(event.info.selectionSetList, "active")) {
    console.log("getting active ..")
    const tmp = (jamSession.active || []).map((s) => { 
      if (s?.participantType === "USER") return  s?.userId || ""
      return ""
    }).filter((i) => { return i != "" }) as string[]
    const uniq = [...new Set(tmp)]

    const keys = uniq.map((s) => { return { userId: { S: s } }})
    
    if (keys.length > 0) {
      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
  
      const active = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u) as User
  
        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
  
        return user
      })

      console.log(JSON.stringify(jamSession.active))
      jamSession.active = merge(jamSession.active, active, "userId", "user") as Participant[]
      console.log(JSON.stringify(jamSession.active))
    }
  }
  
  console.log(JSON.stringify(jamSession))
  return jamSession
}