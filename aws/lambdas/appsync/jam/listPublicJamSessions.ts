import { BatchGetItemCommand, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { hasSubstring, merge } from '../../util/dynamo'

import { _JamSession, _SetList, _Song, _User } from '../../type'

import { AppSyncResolverEvent } from 'aws-lambda'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{}, null>) => {
  console.log(event)
  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new ScanCommand({
      TableName: JAM_TABLE_NAME,
      Select: "ALL_ATTRIBUTES",
      ScanFilter: {
        policy: { 
          AttributeValueList: [ { S: "PUBLIC" }],
          ComparisonOperator: "BEGINS_WITH"
        }
      }
    })
  )

  if (!res0) { console.log("ERROR: empty scan response"); return }
  if (res0.Items && res0.Items.length === 0) return []

  let sessions = res0.Items!.map(s => unmarshall(s) as _JamSession)

  if (hasSubstring(event.info.selectionSetList, "setList")) {
    console.log("getting setList ...")

    const setIds = sessions.map((s) => s.setListId)
    const uniq = [...new Set(setIds)]

    const keys = uniq
      .map((s) => { return { setListId: { S: s } } as { [setListId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[SETLIST_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet setListId. ${res1.$metadata}`); return }
    const sets = res1.Responses![SETLIST_TABLE_NAME].map(s => unmarshall(s)) as _SetList[]

    
    sessions = merge(sessions, sets, "setListId", "setList")
  }

  if (hasSubstring(event.info.selectionSetList, "active")) {
    console.log("getting active users ...")

    const userIds = sessions.map((b) => { 
      let r = [] as string[]
      for (const k of b?.activeIds!) { k && r.push(k)}
      return r as string[]
    })

    const uniq = [...new Set(userIds.flat(1))]

    if (uniq && uniq.length > 0) {
      const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
      console.log(keys)

      const res1 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
      }))
      console.log(res1)
      if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
      
      const users = res1.Responses![USER_TABLE_NAME].map((u) => {
        let user = unmarshall(u)
        if (!user.labelledRecording) user.labelledRecording = []
        if (!user.songsCreated) user.songsCreated = []
        if (!user.editHistory) user.editHistory = []
        if (!user.likedSongs) user.likedSongs = []
        if (!user.friends) user.friends = []
        return user
      })

      console.log(users)
      for (let i=0; i<sessions.length; i++) {
        sessions[i].active = merge(sessions[i].activeIds, users, 'userId', 'active')
      }
    } else {
      console.log("NONE of these sessions have active users, continue ..")
      for (let i=0; i<sessions.length; i++) { sessions[i].active = [] }
    }

  }

  return sessions
}