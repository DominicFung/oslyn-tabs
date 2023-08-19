import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand, GetItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'
import { hasSubstring } from '../../util/dynamo'
import { _User } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, name: string, description: string, imageUrl: string, adminIds: string[] 
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.userId) { console.error(`b.userId is empty`); return }
  if (!b.name) { console.error(`b.name is empty`); return }
  if (!b.description) { console.error(`b.description is empty`); return }
  if (!b.imageUrl) { console.error(`b.imageUrl is empty`); return }

  const dynamo = new DynamoDBClient({})
  const bandId = `${uuidv4()}_bnd`

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.userId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: userId not found: ${b.userId}`); return }
  let band = { bandId, imageUrl: b.imageUrl, userId: b.userId, name: b.name, description: b.description, policy: "PRIVATE" } as any
  
  if (b.adminIds && b.adminIds.length > 0) { band.adminIds = b.adminIds }
  else { band.adminIds = [] }

  const res1 = await dynamo.send(
    new PutItemCommand({
      TableName: BAND_TABLE_NAME,
      Item: marshall(band)
    })
  )

  console.log(res1)
  band.owner = unmarshall(res0.Item)

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
    if (b.adminIds && b.adminIds.length > 0) {
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