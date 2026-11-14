import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge, chunk } from '../../util/dynamo'
import { batchGetAll } from '../../util/batch'
import { normalizeSong, normalizeUser, songReadOptions } from '../../util/selection'
import { User } from '../../API'

import { _JamSong, _SetList, _Song } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new QueryCommand({
      TableName: SETLIST_TABLE_NAME,
      IndexName: "owner",
      KeyConditionExpression: "userId = :key",
      ExpressionAttributeValues: { ":key": { S: b.userId } }
    })
  )

  if (!res0.Items) {
    console.error(`ERROR: sets for userId not found: ${b.userId}`)
    return []
  }

  let sets = res0.Items.map((e) => unmarshall(e)) as _SetList[]
  console.log(sets)
  if (sets.length === 0) { console.log(`set is empty, returning.`); return sets }

  if (hasSubstring(event.info.selectionSetList, "songs")) {
    console.log("getting songs ...")

    const songIds = sets.flatMap((s) => (s.songs || []).map((k) => (k as _JamSong | undefined)?.songId).filter((id): id is string => !!id))
    const uniq = [...new Set(songIds)]
    console.log(`song refs ${uniq.length}, chunks ${chunk(uniq, 100).length}`)

    let songs: _Song[] = []
    if (uniq.length > 0) {
      const rows = await batchGetAll(
        dynamo,
        SONG_TABLE_NAME,
        uniq.map((s) => ({ songId: { S: s } })),
        songReadOptions(event.info.selectionSetList)
      )
      songs = rows.map((s) => normalizeSong(unmarshall(s) as _Song, event.info.selectionSetList))
    }

    if (hasSubstring(event.info.selectionSetList, "song/creator") && songs.length > 0) {
      console.log("getting songs/../song/creator ..")
      const creatorIds = [...new Set(songs.map((s) => s.userId).filter((id) => !!id))]
      const rows = await batchGetAll(
        dynamo,
        USER_TABLE_NAME,
        creatorIds.map((s) => ({ userId: { S: s } }))
      )
      const users = rows.map((s) => normalizeUser(unmarshall(s), event.info.selectionSetList)) as User[]
      songs = merge(songs, users, 'userId', 'creator')
      songs = songs.map((s) => normalizeSong(s, event.info.selectionSetList))
    }

    for (let i = 0; i < sets.length; i++) {
      sets[i].songs = merge(sets[i].songs || [], songs, 'songId', 'song')
    }
  }

  if (hasSubstring(event.info.selectionSetList, "creator")) {
    console.log("getting creator (user) ...")
    const setUsers = [...new Set(sets.map((s) => s.userId).filter((id) => !!id))]
    const rows = await batchGetAll(
      dynamo,
      USER_TABLE_NAME,
      setUsers.map((s) => ({ userId: { S: s } }))
    )
    const users = rows.map((u) => normalizeUser(unmarshall(u), event.info.selectionSetList))
    sets = merge(sets, users, 'userId', 'creator')
  }

  if (hasSubstring(event.info.selectionSetList, "editors")) {
    sets = sets.map((e) => ({ ...e, editors: [] }))
  }

  console.log(JSON.stringify(sets))
  return sets
}
