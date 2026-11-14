import { AttributeValue, DynamoDBClient, GetItemCommand, QueryCommand, QueryCommandInput } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { _Band, _Song, _User } from '../../type'
import { batchGetAll, idList } from '../../util/batch'
import { songReadOptions } from '../../util/selection'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const USER_BAND_MEMBERSHIP_TABLE_NAME = process.env.USER_BAND_MEMBERSHIP_TABLE_NAME || ''

export async function queryAll(
  dynamo: DynamoDBClient,
  input: QueryCommandInput
): Promise<Record<string, AttributeValue>[]> {
  const items: Record<string, AttributeValue>[] = []
  let startKey = input.ExclusiveStartKey
  do {
    const res = await dynamo.send(new QueryCommand({ ...input, ExclusiveStartKey: startKey }))
    if (res.Items) items.push(...res.Items)
    startKey = res.LastEvaluatedKey
  } while (startKey)
  return items
}

export function matchesQuery(
  song: { title?: string | null, artist?: string | null },
  query: string
): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return false
  const title = (song.title || '').toLowerCase()
  const artist = (song.artist || '').toLowerCase()
  return title.includes(needle) || artist.includes(needle)
}

export async function loadUser(dynamo: DynamoDBClient, userId: string): Promise<_User | undefined> {
  const res = await dynamo.send(new GetItemCommand({
    TableName: USER_TABLE_NAME,
    Key: { userId: { S: userId } },
  }))
  if (!res.Item) return undefined
  return unmarshall(res.Item) as _User
}

function songFromRow(row: Record<string, AttributeValue>): _Song {
  return unmarshall(row) as _Song
}

export async function ownSongs(
  dynamo: DynamoDBClient,
  userId: string,
  selectionSetList?: string[]
): Promise<_Song[]> {
  const read = songReadOptions(selectionSetList)
  const rows = await queryAll(dynamo, {
    TableName: SONG_TABLE_NAME,
    IndexName: 'userId',
    KeyConditionExpression: 'userId = :key',
    ExpressionAttributeValues: { ':key': { S: userId } },
    ...(read.projectionExpression ? { ProjectionExpression: read.projectionExpression } : {}),
  })
  return rows.map(songFromRow)
}

/**
 * Songs shared with this user. Looks up each friend's songs on the userId index,
 * then keeps rows that list the user as admin, editor, or viewer.
 * There is no viewer index, so this does not scan the song table.
 */
export async function sharedSongs(
  dynamo: DynamoDBClient,
  userId: string,
  user: _User,
  selectionSetList?: string[]
): Promise<_Song[]> {
  const friendIds = idList(user.friendIds).filter((id) => id !== userId)
  if (friendIds.length === 0) return []

  const read = songReadOptions(selectionSetList)
  const pages = await Promise.all(friendIds.map((friendId) => queryAll(dynamo, {
    TableName: SONG_TABLE_NAME,
    IndexName: 'userId',
    KeyConditionExpression: 'userId = :key',
    ExpressionAttributeValues: { ':key': { S: friendId } },
    ...(read.projectionExpression ? { ProjectionExpression: read.projectionExpression } : {}),
  })))

  return pages.flat().map(songFromRow).filter((song) => {
    if (!song?.songId) return false
    if (idList(song.adminIds).includes(userId)) return true
    if (idList(song.editorIds).includes(userId)) return true
    if (idList(song.viewerIds).includes(userId)) return true
    return false
  })
}

/**
 * Band ids from UserBandMembershipTable. Same key as getUserJamSessions:
 * userId is the partition key, so this is a query, not a scan or the missing role index.
 */
async function membershipBandIds(dynamo: DynamoDBClient, userId: string): Promise<string[]> {
  if (!USER_BAND_MEMBERSHIP_TABLE_NAME) {
    console.error('USER_BAND_MEMBERSHIP_TABLE_NAME is empty')
    return []
  }
  const rows = await queryAll(dynamo, {
    TableName: USER_BAND_MEMBERSHIP_TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: { ':userId': { S: userId } },
  })
  return rows
    .map((row) => unmarshall(row).bandId)
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

/** Song ids on bands this user owns or belongs to. No song-table scan. */
export async function bandSongIds(dynamo: DynamoDBClient, userId: string, user: _User): Promise<Set<string>> {
  const bandIds = new Set<string>(idList(user.bandIds))

  const owned = await queryAll(dynamo, {
    TableName: BAND_TABLE_NAME,
    IndexName: 'owner',
    KeyConditionExpression: 'userId = :key',
    ExpressionAttributeValues: { ':key': { S: userId } },
    ProjectionExpression: 'bandId, songIds',
  })

  const songIds = new Set<string>()
  for (const row of owned) {
    const band = unmarshall(row) as _Band
    if (band.bandId) bandIds.add(band.bandId)
    for (const id of idList(band.songIds)) songIds.add(id)
  }

  for (const bandId of await membershipBandIds(dynamo, userId)) bandIds.add(bandId)

  const ownedIds = new Set(owned.map((row) => (unmarshall(row) as _Band).bandId).filter((id): id is string => !!id))
  const missing = [...bandIds].filter((id) => !ownedIds.has(id))
  if (missing.length > 0) {
    const rows = await batchGetAll(
      dynamo,
      BAND_TABLE_NAME,
      missing.map((id) => ({ bandId: { S: id } })),
      { projectionExpression: 'bandId, songIds' }
    )
    for (const row of rows) {
      const band = unmarshall(row) as _Band
      for (const id of idList(band.songIds)) songIds.add(id)
    }
  }

  return songIds
}

export async function songsByIds(
  dynamo: DynamoDBClient,
  songIds: string[],
  selectionSetList?: string[]
): Promise<_Song[]> {
  if (songIds.length === 0) return []
  const read = songReadOptions(selectionSetList)
  const rows = await batchGetAll(
    dynamo,
    SONG_TABLE_NAME,
    songIds.map((id) => ({ songId: { S: id } })),
    read.projectionExpression ? { projectionExpression: read.projectionExpression } : undefined
  )
  return rows.map(songFromRow)
}

export function songSharedWith(song: _Song, userId: string): boolean {
  if (song.userId === userId) return true
  if (idList(song.adminIds).includes(userId)) return true
  if (idList(song.editorIds).includes(userId)) return true
  if (idList(song.viewerIds).includes(userId)) return true
  return false
}
