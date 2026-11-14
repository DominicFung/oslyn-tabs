import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { _Band, _Song } from '../../type'
import { hasSubstring, merge, multiMerge } from '../../util/dynamo'
import { batchGetAll, idList } from '../../util/batch'
import { normalizeSong, normalizeUser, songReadOptions } from '../../util/selection'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new QueryCommand({
      TableName: BAND_TABLE_NAME,
      IndexName: "owner",
      KeyConditionExpression: "userId = :key",
      ExpressionAttributeValues: { ":key": { S: b.userId } }
    })
  )

  if (!res0.Items) {
    console.error(`ERROR: bands for userId not found: ${b.userId}`)
    return []
  }

  let bands = res0.Items.map((e) => {
    const band = unmarshall(e) as _Band
    band.songIds = idList(band.songIds)
    band.adminIds = idList(band.adminIds)
    return band
  })
  console.log(bands)
  if (bands.length === 0) { console.log(`bands is empty, returning.`); return bands }

  if (hasSubstring(event.info.selectionSetList, "owner")) {
    console.log("getting owner ...")
    const res1 = await dynamo.send(
      new GetItemCommand({ TableName: USER_TABLE_NAME, Key: { userId: { S: b.userId } } })
    )

    if (!res1.Item) { console.error("ERROR: Could not find band owner."); return }
    const owner = normalizeUser(unmarshall(res1.Item), event.info.selectionSetList)
    bands = bands.map((band) => ({ ...band, owner }))
  }

  if (hasSubstring(event.info.selectionSetList, "songs")) {
    console.log("getting songs ...")

    const songIds = [...new Set(bands.flatMap((band) => idList(band.songIds)))]
    console.log(`band song ids ${songIds.length}`)

    if (songIds.length > 0) {
      const rows = await batchGetAll(
        dynamo,
        SONG_TABLE_NAME,
        songIds.map((s) => ({ songId: { S: s } })),
        songReadOptions(event.info.selectionSetList)
      )
      let songs = rows.map((s) => normalizeSong(unmarshall(s) as _Song, event.info.selectionSetList))

      if (hasSubstring(event.info.selectionSetList, "songs/creator") && songs.length > 0) {
        console.log("getting songs/../song/creator ..")
        const creatorIds = [...new Set(songs.map((s) => s.userId).filter((id) => !!id))]
        const userRows = await batchGetAll(
          dynamo,
          USER_TABLE_NAME,
          creatorIds.map((s) => ({ userId: { S: s } }))
        )
        const users = userRows.map((s) => normalizeUser(unmarshall(s), event.info.selectionSetList))
        songs = merge(songs, users, 'userId', 'creator')
        songs = songs.map((s) => normalizeSong(s, event.info.selectionSetList))
      }

      bands = multiMerge(bands || [], songs, 'songIds', 'songId', 'songs')
    } else {
      console.log("NONE of this user's bands has songs, continue ..")
      for (let i = 0; i < bands.length; i++) { bands[i].songs = [] }
    }
  }

  if (hasSubstring(event.info.selectionSetList, "sets")) {
    bands = bands.map((e) => ({ ...e, sets: [] }))
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    console.log("getting admins (user) ...")
    const adminIds = [...new Set(bands.flatMap((band) => idList(band.adminIds)))]

    if (adminIds.length > 0) {
      const rows = await batchGetAll(
        dynamo,
        USER_TABLE_NAME,
        adminIds.map((s) => ({ userId: { S: s } }))
      )
      const users = rows.map((u) => normalizeUser(unmarshall(u), event.info.selectionSetList))
      for (let i = 0; i < bands.length; i++) {
        ;(bands[i] as any).admins = merge((bands[i] as any).admins, users, 'userId', 'admin')
      }
    } else {
      console.log("NONE of this user's bands has admins, continue ..")
      for (let i = 0; i < bands.length; i++) { (bands[i] as any).admins = [] }
    }
  }

  if (hasSubstring(event.info.selectionSetList, "members")) {
    bands = bands.map((e) => ({ ...e, members: [] }))
  }

  console.log(JSON.stringify(bands))
  return bands
}
