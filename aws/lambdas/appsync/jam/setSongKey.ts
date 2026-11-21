import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { JamSession } from '../../API'
import { asPlaylist } from '../../util/songIndex'
import { liveIndex } from '../../util/liveJamSong'
import { _SetList } from '../../type'


const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''

type _JamSession = JamSession & {
  setListId: string
}

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, song?: number, key: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.creatorId is empty`); return }
  if (!b.key) { console.error(`b.key is empty`); return }

  const dynamo = new DynamoDBClient({})
  console.log(`song: ${b.song}`)

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: JAM_TABLE_NAME, Key: { jamSessionId: { S: b.jamSessionId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: jamSessionId not found: ${b.jamSessionId}`); return }
  const jam = unmarshall(res0.Item) as _JamSession & { playlist?: unknown }
  
  let song = b.song
  if (song === undefined || song === null) song = jam.currentSong || 0

  const playlist = Array.isArray(jam.playlist) ? asPlaylist(jam.playlist) : null
  if (playlist) {
    if (liveIndex(song, [], jam.playlist) == null) {
      console.error(`song at index: ${song} not found`)
      return
    }
    playlist[song] = { ...playlist[song], key: b.key }
    await dynamo.send(new UpdateItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } },
      UpdateExpression: 'SET playlist = :playlist',
      ExpressionAttributeValues: marshall({ ':playlist': playlist }),
    }))
    return { jamSessionId: b.jamSessionId, song, key: b.key }
  }

  const setRes = await dynamo.send(new GetItemCommand({
    TableName: SETLIST_TABLE_NAME,
    Key: { setListId: { S: jam.setListId } },
    ProjectionExpression: 'songs',
  }))
  const setSongs = setRes.Item ? ((unmarshall(setRes.Item) as _SetList).songs || []) : []
  if (liveIndex(song, setSongs, undefined) == null) {
    console.error(`song at index: ${song} not found`)
    return
  }

  const res1 = await dynamo.send(
    new UpdateItemCommand({
      TableName: SETLIST_TABLE_NAME,
      Key: { setListId: { S: jam.setListId } },
      UpdateExpression: `SET songs[${song}].#ri = :ri`,
      ExpressionAttributeValues: { ":ri": { S: b.key } },
      ExpressionAttributeNames: {"#ri": "key"}
    })
  )
  console.log(res1)
  return { jamSessionId: b.jamSessionId, song, key: b.key }
}