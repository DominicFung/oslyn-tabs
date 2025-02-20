import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'
import { _JamSession, _SetList } from '../../type'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, song?: number, page?: number
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.jamSessionId is empty`); return }

  const dynamo = new DynamoDBClient({})
  console.log(`song: ${b.song}`)

  const r0 = dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } }
  }))
  
  let updateJam = { 
    table: JAM_TABLE_NAME, 
    key: { jamSessionId: b.jamSessionId },
    item: { currentSong: b.song || 0, currentPage: b.page || 0 } as any
  }

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

  // if song number is not there, check if there is anything queued up. If not, check whats next on the set list.
  if (b.song == undefined || b.song == null ) {
    console.log(`since no song number is provided, we will check if there is anything queued up.`)

    if (jam.queue && jam.queue.length > 0) {
      console.log(`something in queue: ${JSON.stringify(jam.queue)}`)
      b.song = jam.queue.shift() as number
      updateJam.item.currentSong = b.song
      updateJam.item.currentPage = 0
      updateJam.item.queue = jam.queue as number[]
      console.log(`new song: ${updateJam.item.currentSong}`, `new queue: ${JSON.stringify(updateJam.item.queue)}`)
    } else if (jam.currentSong!+1 < set.songs!.length) {
      b.song = jam.currentSong!+1
      updateJam.item.currentSong = jam.currentSong!+1
      updateJam.item.currentPage = 0
      console.log(`no song, but not queue. Current song +1 ${updateJam.item.currentSong}`)
    } else if (jam.currentSong!+1 === set.songs!.length) {
      updateJam.item.currentSong = 0
      updateJam.item.currentPage = 0
    }
  } else {
    updateJam.item.currentSong = b.song!
  }

  const params = updateDynamoUtil(updateJam)
  console.log(params)
  console.log("params calculated")

  const res2 = await dynamo.send(new UpdateItemCommand(params))
  console.log(res2)

  console.log({ jamSessionId: b.jamSessionId, song: b.song, currentPage: b.page || 0, key: song.key || "C", queue: jam.queue })
  return { jamSessionId: b.jamSessionId, song: b.song, currentPage: b.page || 0, key: song.key || "C", queue: jam.queue }
}