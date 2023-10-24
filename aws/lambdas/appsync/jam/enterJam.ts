import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, BatchGetItemCommand, UpdateItemCommandInput, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'
import { hasSubstring } from '../../util/dynamo'

import { Guest, JamSessionActiveUsers, Participant, User } from '../../API'
import { _JamSession, _JamSong, _SetList } from '../../type'
import { updateDynamoUtil } from '../../util/dynamo'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

const COLORS = [ 
  "red", "orange", "amber", "yellow", "lime", 
  "green", "emerald", "teal", "cyan", "sky", "blue", 
  "indigo", "violet", "purple", "fuchsia", "pink", "rose"
]

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, userId?: string, guestName?: string, colour?: string, ip?: string
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
  let latest = null as Participant | null

  // check authorization
  if (jamSession.policy === "PRIVATE") {
    if (!b.userId) { console.error(`This is a private jam session. No guests allowed.`); return }
    
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
    
    } else if (b.guestName) { 
      const guestNames = (jamSession.guests || []).map((s) => s?.username)
      const uniq = [...new Set(guestNames)]

      if (uniq.includes(b.guestName)) {
        console.error(`Guest name "${b.guestName}" already exists. Please use another.`); 
        throw new Error(`Sorry, this guest name is already taken!`)
      }

      let colour = b.colour || COLORS[(Math.floor(Math.random() * COLORS.length))]
      if (colour === "random") colour = COLORS[(Math.floor(Math.random() * COLORS.length))]

      const guest = {
        userId: `${uuidv4()}_gst`,
        username: b.guestName,
        colour: colour,
        joinTime: Date.now()
      } as Guest

      latest = guest
      latest.__typename = "Guest"

      if (b.ip) guest.ip = b.ip

      param = updateDynamoUtil({
        table: JAM_TABLE_NAME,
        item: { guests: [...(jamSession.guests || []), guest] },
        key: { jamSessionId: b.jamSessionId }
      })
    } else { console.error(`Neither guest name nor userId provided.`); return }
  }

  if (param) {
    const res1 = await dynamo.send(new UpdateItemCommand(param))
    console.log(res1)
  }

  if (hasSubstring(event.info.selectionSetList, "active")) {
    const keys = (jamSession.activeIds || []).map((s) => { return { userId: { S: s } } as { [songId: string]: any } })
    if (keys.length > 0) {
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
    } else jamSession.active = [] 
  }
  
  if (!jamSession.guests) jamSession.guests = []
  console.log(JSON.stringify(jamSession))

  

  return {
    active: jamSession.active,
    guests: jamSession.guests,
    latest
  } as JamSessionActiveUsers
}