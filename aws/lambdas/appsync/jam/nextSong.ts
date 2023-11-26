import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'
import { _JamSession, _SetList } from '../../type'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, song: number, page?: number
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.jamSessionId is empty`); return }

  const dynamo = new DynamoDBClient({})
  console.log(`song: ${b.song}`)

  const params = updateDynamoUtil({ 
    table: JAM_TABLE_NAME, 
    key: { jamSessionId: b.jamSessionId },
    item: { currentSong: b.song, currentPage: b.page || 0 } 
  })

  const r0 = dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } }
  }))

  console.log(params)
  console.log("params calculated")
  const res1 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res1)

  const res0 = (await (r0))?.Item
  if (!res0) { console.error(`Jam not found: ${b.jamSessionId}`); return }

  const jam = unmarshall(res0) as _JamSession
  const setListId = jam.setListId

  const res2 = await dynamo.send(new GetItemCommand({
    TableName: SETLIST_TABLE_NAME, Key: { setListId: { S: setListId } }
  }))
  if (!res2 || !res2.Item) { console.error(`SetList not found: ${setListId}`); return }
  const set = unmarshall(res2.Item) as _SetList

  const song = set.songs[b.song]
  if (!song) { console.error(`song at index: ${b.song} not found`); return }

  return { jamSessionId: b.jamSessionId, song: b.song, currentPage: b.page || 0, key: song.key || "C" }
}