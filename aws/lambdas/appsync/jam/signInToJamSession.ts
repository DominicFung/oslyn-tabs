import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, BatchGetItemCommand, UpdateItemCommandInput, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { hasSubstring } from '../../util/dynamo'

import { User } from '../../API'
import { _JamSession, _JamSong, _SetList } from '../../type'
import { updateDynamoUtil } from '../../util/dynamo'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, userId?: string, guestName?: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.setListId is empty`); return }

  const dynamo = new DynamoDBClient({})
  const res1 = await dynamo.send(
    new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } }
    })
  )
  if (!res1.Item) { console.error(`ERROR: jamSessionId not found: ${b.jamSessionId}`); return }
  let jamSession = unmarshall(res1.Item) as _JamSession

  let param = null as UpdateItemCommandInput | null

  // check authorization
  if (jamSession.policy === "PRIVATE") {
    if (!b.userId) { console.error(`This is a private jam session.`); return }
    
    if ((jamSession.adminIds || []).includes(b.userId)) { console.log("is an admin, athorized") }
    else if ((jamSession.memberIds || []).includes(b.userId)) { console.log("is a member, athorized") }
    else { console.error(`This is a private jam session.`); return }

    param = updateDynamoUtil({
      table: JAM_TABLE_NAME,
      item: { activeIds: [...new Set([ ...(jamSession.activeIds || []), b.userId ])] },
      key: { jamSessionId: b.jamSessionId }
    })
  } else {
    if (b.userId) {
      param = updateDynamoUtil({
        table: JAM_TABLE_NAME,
        item: { activeIds: [...new Set([ ...(jamSession.activeIds || []), b.userId ])] },
        key: { jamSessionId: b.jamSessionId }
      })
    } else if (b.guestName && !(jamSession.guests || []).includes(b.guestName)) {
      param = updateDynamoUtil({
        table: JAM_TABLE_NAME,
        item: { guests: [...(jamSession.guests || []), b.guestName] },
        key: { jamSessionId: b.jamSessionId }
      })
    } else if (b.guestName) { // guestName already exists
      console.error(`Guest name "${b.guestName}" already exists. Please use another.`); return
    } else { console.error(`Neither guest name nor userId provided.`); return }
  }

  if (param) {
    const res1 = await dynamo.send(new UpdateItemCommand(param))
    console.log(res1)
  }

  if (hasSubstring(event.info.selectionSetList, "active")) {
    const keys = (jamSession.activeIds || []).map((s) => { return { userId: { S: s } } as { [songId: string]: any } })
    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 

    const active = res1.Responses![USER_TABLE_NAME].map((u) => {
      let user = unmarshall(u) as User

      if (!user.labelledRecording) user.labelledRecording = []
      if (!user.songsCreated) user.songsCreated = []
      if (!user.editHistory) user.editHistory = []
      if (!user.likedSongs) user.likedSongs = []
      if (!user.friends) user.friends = []

      return user
    })
    jamSession.active = active
  }
  
  if (!jamSession.guests) jamSession.guests = []
  console.log(JSON.stringify(jamSession))
  return jamSession
}