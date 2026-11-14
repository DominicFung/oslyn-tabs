import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { _Band, _Song, _User } from '../../type'
import { hasSubstring, merge } from '../../util/dynamo'
import { batchGetAll, idList } from '../../util/batch'
import { normalizeSong, normalizeUser, songReadOptions } from '../../util/selection'
import { User } from '../../API'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{}, null>) => {
  console.log(event)

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new ScanCommand({
      TableName: BAND_TABLE_NAME,
      Select: "ALL_ATTRIBUTES",
      ScanFilter: {
        policy: {
          AttributeValueList: [{ S: "PUBLIC" }],
          ComparisonOperator: "BEGINS_WITH"
        }
      }
    })
  )

  if (!res0) { console.log("ERROR: empty scan response"); return }
  if (res0.Items && res0.Items.length === 0) return []

  let bands = res0.Items!.map((e) => {
    const band = unmarshall(e) as _Band
    band.songIds = idList(band.songIds)
    band.adminIds = idList(band.adminIds)
    return band
  })
  console.log(bands)

  if (bands.length === 0) { console.log(`bands is empty, returning.`); return bands }

  if (hasSubstring(event.info.selectionSetList, "owner")) {
    console.log("getting owner ...")
    const uniq = [...new Set(bands.map((b) => b.userId).filter((id) => !!id))]
    const rows = await batchGetAll(
      dynamo,
      USER_TABLE_NAME,
      uniq.map((s) => ({ userId: { S: s } }))
    )
    const owners = rows.map((o) => normalizeUser(unmarshall(o), event.info.selectionSetList)) as _User[]
    bands = merge(bands, owners, 'userId', 'owner')
  }

  if (hasSubstring(event.info.selectionSetList, "songs")) {
    console.log("getting songs ...")
    const uniq = [...new Set(bands.flatMap((b) => idList(b.songIds)))]
    console.log(uniq)

    if (uniq.length > 0) {
      const rows = await batchGetAll(
        dynamo,
        SONG_TABLE_NAME,
        uniq.map((s) => ({ songId: { S: s } })),
        songReadOptions(event.info.selectionSetList)
      )
      let songs = rows.map((s) => normalizeSong(unmarshall(s) as _Song, event.info.selectionSetList))

      if (hasSubstring(event.info.selectionSetList, "song/creator") && songs.length > 0) {
        console.log("getting songs/../song/creator ..")
        const creatorIds = [...new Set(songs.map((s) => s.userId).filter((id) => !!id))]
        const userRows = await batchGetAll(
          dynamo,
          USER_TABLE_NAME,
          creatorIds.map((s) => ({ userId: { S: s } }))
        )
        const users = userRows.map((s) => normalizeUser(unmarshall(s), event.info.selectionSetList)) as User[]
        songs = merge(songs, users, 'userId', 'creator')
        songs = songs.map((s) => normalizeSong(s, event.info.selectionSetList))
      }

      for (let i = 0; i < bands.length; i++) {
        bands[i].songs = merge(bands[i].songs || [], songs, 'songId', 'song')
      }
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
    const uniq = [...new Set(bands.flatMap((b) => idList(b.adminIds)))]

    if (uniq.length > 0) {
      const rows = await batchGetAll(
        dynamo,
        USER_TABLE_NAME,
        uniq.map((s) => ({ userId: { S: s } }))
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
