import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'
import { batchGetAll, idList } from '../../util/batch'
import { User } from '../../API'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  setListId: string, songId: string, key: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.setListId) { console.error(`b.setListId is empty`); return }
  if (!b.songId) { console.error(`b.songId is empty`); return }
  if (!b.key) { console.error(`b.key is empty`); return }

  const dynamo = new DynamoDBClient({})
  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: SETLIST_TABLE_NAME,
      Key: { setListId: { S: b.setListId } }
    })
  )
  if (!res0.Item) { console.error(`ERROR: setListId not found: ${b.setListId}`); return }
  let setList = unmarshall(res0.Item)
  const ownerId = (setList.userId || setList.creatorId) as string | undefined
  if (!ownerId) { console.error(`ERROR: set owner not found on ${b.setListId}`); return }

  const songRes = await dynamo.send(new GetItemCommand({
    TableName: SONG_TABLE_NAME,
    Key: { songId: { S: b.songId } },
  }))
  if (!songRes.Item) { console.error(`ERROR: songId not found: ${b.songId}`); return }

  const res2 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: ownerId } }
    })
  )
  if (!res2.Item) { console.error(`ERROR: set owner not found: ${ownerId}`); return }
  const creator = unmarshall(res2.Item) as User

  const setListSongs = Array.isArray(setList.songs) ? [...setList.songs] : []
  setListSongs.push({ songId: b.songId, key: b.key })
  setList.songs = setListSongs

  const params = updateDynamoUtil({
    table: SETLIST_TABLE_NAME,
    item: { songs: setListSongs },
    key: { setListId: setList.setListId },
  })
  const res3 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res3)

  if (hasSubstring(event.info.selectionSetList, "creator")) { setList.creator = creator }
  if (hasSubstring(event.info.selectionSetList, "editors")) {
    const editorIds = idList(setList.editorIds)
    if (editorIds.length === 0) {
      setList.editors = []
    } else {
      const rows = await batchGetAll(
        dynamo,
        USER_TABLE_NAME,
        editorIds.map((id) => ({ userId: { S: id } }))
      )
      setList.editors = rows.map((row) => unmarshall(row))
    }
  }

  return setList
}
