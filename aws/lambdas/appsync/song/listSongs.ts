import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge } from '../../util/dynamo'
import { batchGetAll } from '../../util/batch'
import { normalizeSong, normalizeUser, songReadOptions } from '../../util/selection'

import { _Song } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  const dynamo = new DynamoDBClient({})
  const read = songReadOptions(event.info.selectionSetList)

  const res0 = await dynamo.send(
    new QueryCommand({
      TableName: SONG_TABLE_NAME,
      IndexName: "userId",
      KeyConditionExpression: "userId = :key",
      ExpressionAttributeValues: { ":key": { S: b.userId } },
      ...(read.projectionExpression ? { ProjectionExpression: read.projectionExpression } : {}),
    })
  )

  if (!res0.Items) {
    console.error(`ERROR: songs for userId not found: ${b.userId}`)
    return []
  }
  let songs = res0.Items.map((e) => unmarshall(e) as _Song)
  console.log(songs)

  if (hasSubstring(event.info.selectionSetList, "creator") && songs.length > 0) {
    console.log("getting creator (user) ...")

    const songUsers = [...new Set(songs.map((s) => s.userId).filter((id) => !!id))]
    const rows = await batchGetAll(
      dynamo,
      USER_TABLE_NAME,
      songUsers.map((s) => ({ userId: { S: s } }))
    )
    const users = rows.map((u) => normalizeUser(unmarshall(u), event.info.selectionSetList))
    songs = merge(songs, users, 'userId', 'creator')
  }

  if (hasSubstring(event.info.selectionSetList, "editors")) {
    songs = songs.map(s => { s.editors = []; return s })
  }

  if (hasSubstring(event.info.selectionSetList, "viewers")) {
    songs = songs.map(s => { s.viewers = []; return s })
  }

  songs = songs.map((s) => normalizeSong(s, event.info.selectionSetList))
  console.log(songs)
  return songs
}
