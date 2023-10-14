import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, UpdateItemCommand, GetItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'
import { _User, _Band } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  bandId: string, imageUrl?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.bandId) { console.error(`b.bandId is empty`); return }

  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: BAND_TABLE_NAME,
      Key: { bandId : { S: b.bandId } }
    })
  )
  
  if (!res0.Item) { console.error(`ERROR: bandId not found: ${b.bandId}`); return }

  const band = unmarshall(res0.Item) as any
  if (b.imageUrl) band.imageUrl = b.imageUrl

  const params = updateDynamoUtil({ table: BAND_TABLE_NAME, item: { imageUrl: band.imageUrl }, key: { bandId: band.bandId } })
  const res1 = await dynamo.send( new UpdateItemCommand(params) )
  console.log(res1)

  const res2 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: band.userId } }
    })
  )

  if (!res2.Item) { console.error(`ERROR: userId not found: ${band.userId}`); return }
  band.owner = unmarshall(res2.Item)

  if (!band.owner.labelledRecording) band.owner.labelledRecording = []
  if (!band.owner.songsCreated) band.owner.songsCreated = []
  if (!band.owner.editHistory) band.owner.editHistory = []
  if (!band.owner.likedSongs) band.owner.likedSongs = []
  if (!band.owner.friends) band.owner.friends = []

  if (hasSubstring(event.info.selectionSetList, "songs")) {
    band.songs = [] // this is a new band, no songs
  }

  if (hasSubstring(event.info.selectionSetList, "sets")) {
    band.sets = [] // this is a new band, no sets
  }

  if (hasSubstring(event.info.selectionSetList, "members")) {
    band.members = [] // this is a new band, so no members
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    if (band.adminIds && band.adminIds.length > 0) {
      const uniq = [...new Set(band.adminIds)]
      const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))

      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  }
      
      band.admins = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u) as _User

        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })
    } else { band.admins = [] }
  }

  return band

}