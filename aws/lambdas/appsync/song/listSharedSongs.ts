import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge } from '../../util/dynamo'
import { batchGetAll, idList } from '../../util/batch'
import { normalizeSong, normalizeUser, songReadOptions } from '../../util/selection'

import { _Song, _User } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, optimize?: boolean | null
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  // The friend search is the only implemented path. `new Boolean(flag)` is an
  // object and was always truthy, and a missing flag used to return nothing.
  // Run the friend search whether or not optimize is set.
  console.log(`listSharedSongs optimize=${String(b.optimize)}`)

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId : { S: b.userId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: could not find userId: ${b.userId}`); return [] }
  const user = unmarshall(res0.Item) as _User
  console.log(user)

  const friendIds = idList(user.friendIds)
  if (friendIds.length === 0) {
    console.log('no friends to search, returning []')
    return []
  }

  const read = songReadOptions(event.info.selectionSetList)
  const queries = friendIds.map((friendId) => dynamo.send(
    new QueryCommand({
      TableName: SONG_TABLE_NAME,
      IndexName: "userId",
      KeyConditionExpression: "userId = :key",
      ExpressionAttributeValues: { ":key": { S: friendId } },
      ...(read.projectionExpression ? { ProjectionExpression: read.projectionExpression } : {}),
    })
  ))

  const res3 = await Promise.all(queries)
  let songs = res3.flatMap((d) => (d.Items || []).map((u) => unmarshall(u) as _Song))
  console.log(songs)

  songs = songs.filter((s) => {
    if (!s) return false
    if (idList(s.adminIds).includes(b.userId)) return true
    if (idList(s.editorIds).includes(b.userId)) return true
    if (idList(s.viewerIds).includes(b.userId)) return true
    return false
  })

  console.log(songs)
  if (songs.length === 0) return songs

  if (hasSubstring(event.info.selectionSetList, "creator")) {
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

  return songs.map((s) => normalizeSong(s, event.info.selectionSetList))
}
