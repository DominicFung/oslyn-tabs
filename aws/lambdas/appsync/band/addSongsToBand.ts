import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, BatchGetItemCommand, UpdateItemCommand, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'

const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  bandId: string, songIds: string[]
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.bandId) { console.error(`b.bandId is empty`); return }
  if (!b.songIds || b.songIds.length === 0) { 
    console.error(`b.songIds is empty`); return 
  }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: BAND_TABLE_NAME,
      Key: { bandId : { S: b.bandId } }
    })
  )
  
  if (!res0.Item) { console.error(`ERROR: bandId not found: ${b.bandId}`); return }

  const band = unmarshall(res0.Item) as { songIds: string[], songs: any }
  let songIds = [] as string[]
  for (let sid of b.songIds) { if ( !band.songIds.includes(sid) ) { songIds.push(sid) } }
  if (!songIds) { console.error(`nothing to add. Existing band: ${band.songIds} > new song ids: ${b.songIds}`); return }
  
  band.songIds = [...band.songIds, ...songIds]
  const params = updateDynamoUtil({ table: BAND_TABLE_NAME, item: { songIds: band.songIds } })
  const res1 = await dynamo.send( new UpdateItemCommand(params) )
  console.log(res1)

  console.log(event.info.selectionSetList)
  //https://docs.aws.amazon.com/appsync/latest/devguide/resolver-context-reference.html
  if (hasSubstring(event.info.selectionSetList, "songs")) {
    // this means that gql is asking for songs. We need to fetch them all.

    const keys = band.songIds.map((s) => { return {songId: s} as { [songId: string]: any } })
    const res2 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {SONG_TABLE_NAME: { Keys: keys }}
    }))
    console.log(res2)
    if (!res2.Responses) { console.error(`ERROR: unable to BatchGet songId. ${res2.$metadata}`); return  } 

    const songs = res2.Responses![SONG_TABLE_NAME]
    band.songs = []
    for(let s of songs) { band.songs.push(s) }
  }

  return band
}