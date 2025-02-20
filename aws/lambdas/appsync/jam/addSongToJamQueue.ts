import { AppSyncResolverEvent } from 'aws-lambda'
import { GetItemCommand, DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'
import { _JamSession, _SetList } from '../../type'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, song: number
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.jamSessionId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const r0 = dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } }
  }))

  const res0 = (await (r0))?.Item
  if (!res0) { console.error(`Jam not found: ${b.jamSessionId}`); return }

  const jam = unmarshall(res0) as _JamSession
  const setListId = jam.setListId
  
  const res1 = await dynamo.send(new GetItemCommand({
    TableName: SETLIST_TABLE_NAME, Key: { setListId: { S: setListId } }
  }))
  if (!res1 || !res1.Item) { console.error(`SetList not found: ${setListId}`); return }
  const set = unmarshall(res1.Item) as _SetList

  const song = set.songs[b.song || 0]
  if (!song) { console.error(`song at index: ${b.song} not found`); return }

  let queue = jam.queue || []
  queue.push(b.song || 0)

  const res2 = dynamo.send(new UpdateItemCommand(
    updateDynamoUtil({
      table: JAM_TABLE_NAME,
      key: { jamSessionId: jam.jamSessionId },
      item: { queue }
    })
  ))
  console.log(res2)

  return { jamSessionId: b.jamSessionId, queue }
}