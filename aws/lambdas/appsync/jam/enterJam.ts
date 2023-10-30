import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, BatchGetItemCommand, UpdateItemCommandInput, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'
import { hasSubstring, merge } from '../../util/dynamo'

import { JamSessionActiveUsers, Participant, User } from '../../API'
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

  const userIds = (jamSession.active || []).map((s) => s?.userId)
  const uniq = [...new Set(userIds)]

  if (b.userId && uniq.includes(b.userId)) {
    console.error(`${b.userId} is already a part of this session, continuing ...`); return
  } else {
    // check authorization
    if (jamSession.policy === "PRIVATE") {
      if (!b.userId) { console.error(`This is a private jam session. No guests allowed.`); return }
      
      if ((jamSession.adminIds || []).includes(b.userId)) { console.log("is an admin, athorized") }
      else if ((jamSession.memberIds || []).includes(b.userId)) { console.log("is a member, athorized") }
      else { console.error(`This is a private jam session.`); return }

      latest = {
        userId: b.userId,
        colour: COLORS[(Math.floor(Math.random() * COLORS.length))],
        joinTime: Date.now(),
        lastPing: Date.now(),
        participantType: "USER"
      } as Participant

      param = updateDynamoUtil({
        table: JAM_TABLE_NAME,
        item: { active: [ ...(jamSession.active || []), latest ] },
        key: { jamSessionId: b.jamSessionId }
      })
    } else {
      if (b.userId) {
        latest = {
          userId: b.userId,
          colour: COLORS[(Math.floor(Math.random() * COLORS.length))],
          joinTime: Date.now(),
          lastPing: Date.now(),
          participantType: "USER"
        } as Participant
    
        param = updateDynamoUtil({
          table: JAM_TABLE_NAME,
          item: { active: [ ...(jamSession.active || []), latest ] },
          key: { jamSessionId: b.jamSessionId }
        })
      } else if (b.guestName) { 
        const guestNames = (jamSession.active || []).map((s) => s?.username)
        const uniq = [...new Set(guestNames)]

        if (uniq.includes(b.guestName)) {
          console.error(`Guest name "${b.guestName}" already exists. Please use another.`); 
          throw new Error(`Sorry, this guest name is already taken!`)
        }

        let colour = b.colour || COLORS[(Math.floor(Math.random() * COLORS.length))]
        if (colour === "random") colour = COLORS[(Math.floor(Math.random() * COLORS.length))]

        latest = {
          userId: `${uuidv4()}_gst`,
          participantType: "GUEST",
          username: b.guestName,
          colour: colour,
          
          joinTime: Date.now(),
          lastPing: Date.now()
        } as Participant

        if (b.ip) latest.ip = b.ip

        param = updateDynamoUtil({
          table: JAM_TABLE_NAME,
          item: { active: [...(jamSession.active || []), latest] },
          key: { jamSessionId: b.jamSessionId }
        })
      } else { console.error(`Neither guest name nor userId provided.`); return }
    }
  }

  if (param) {
    const res1 = await dynamo.send(new UpdateItemCommand(param))
    console.log(res1)
  }

  if (hasSubstring(event.info.selectionSetList, "active")) {
    const keys = (jamSession.active || []).map((s) => { 
      if (s?.participantType === "USER") return { userId: { S: s?.userId } }
      return ""
    }).filter((i) => { return i != "" }) as { [songId: string]: any }[]

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

      console.log(JSON.stringify(jamSession.active))
      jamSession.active = merge(jamSession.active, active, "userId", "active") as Participant[]
      console.log(JSON.stringify(jamSession.active))
    }

    // in case, the BatchGet did not include the latest addition.
    const uniq = jamSession.active.map((s) => s?.userId)
    if (uniq.includes(latest.userId)) jamSession.active.push(latest)
  }
  
  console.log(JSON.stringify(jamSession))

  const r = {
    jamSessionId: jamSession.jamSessionId,
    active: jamSession.active, latest
  } as JamSessionActiveUsers
  console.log(r)

  return r
}