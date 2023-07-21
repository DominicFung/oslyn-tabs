import { AppSyncResolverEvent } from 'aws-lambda'
import { BatchGetItemCommand, DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
//import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'
import { v4 as uuidv4 } from 'uuid'
import { _Song, _User } from '../../type'

//import { generateEmail } from '../../email/share'
import { User, access } from '../../API'
import { hasSubstring, updateDynamoUtil } from '../../util/dynamo'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const INVITE_TABLE_NAME = process.env.INVITE_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, songId: string, shareWithEmail: string, access: access
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }

  if (!b.userId) { console.error(`b.userId is empty`); return }
  if (!b.songId) { console.error(`b.songId is empty`); return }
  if (!b.shareWithEmail) { console.error(`b.shareWithEmail is empty`); return }
  const email = b.shareWithEmail

  const dynamo = new DynamoDBClient({})

  // check if user owns this song
  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: SONG_TABLE_NAME,
      Key: { songId: { S: b.songId } }
    })
  )

  if (!res0.Item) { console.error(`ERROR: songId not found ${b.songId}`); return }
  let song = unmarshall(res0.Item) as _Song

  let authorizedToShare = false
  if (song.userId === b.userId) { authorizedToShare = true }
  if (song.adminIds && song.adminIds.includes(b.userId)) { authorizedToShare = true }

  if (!authorizedToShare) { console.error(`ERROR: ${b.userId} is not authorized to share this song`); return }

  /** check if email is already taken */
  const res1 = await dynamo.send(
    new QueryCommand({
      TableName: USER_TABLE_NAME,
      IndexName: "email",
      KeyConditionExpression: "email = :key",
      ExpressionAttributeValues: { ":key": { S: email } }
    })
  )

  if (!res1) { console.error(`dynamo did not return a res1 for ${email}`); return }
  if (res1.Count! > 0 && res1.Items) {
    let user = unmarshall(res1.Items[0]) as _User
    console.log(`${email} found as ${user.userId} ..`)

    /**
     * Add User to Song as Admin / Editor / Viewer
     */
    console.log(`Adding ${user.userId} as "${b.access}" to ${b.songId} ..`)
    if (song.userId === user.userId) { console.error("cannot share with self."); return }
    else if (song.adminIds && song.adminIds.includes(user.userId)) {
      console.log(console.log(`user already an admin, nothing to add.`)  )
    }
    else if (song.editorIds && song.editorIds.includes(user.userId)) {
      console.log(console.log(`user already an editor, nothing to add.`)  )
    }
    else if (song.viewerIds && song.viewerIds.includes(user.userId)) {
      console.log(console.log(`user already an viewer, nothing to add.`)  )
    }
    else {
      //Add the user based on access
      let item = {} as any
      if ( b.access === "admin") {
        item = { adminIds: song.adminIds || [] }
        item.adminIds.push(user.userId)
        song.adminIds = item.adminIds
      } else if (b.access === "edit") {
        item = { editorIds: song.editorIds || [] }
        item.editorIds.push(user.userId)
        song.editorIds = item.editorIds
      } else {
        item = { viewerIds: song.viewerIds || [] }
        item.viewerIds.push(user.userId)
        song.viewerIds = item.viewerIds
      }

      console.log(item)
      const params = updateDynamoUtil({ 
        table: SONG_TABLE_NAME, 
        key: { songId: b.songId },
        item
      })
      const res2 = await dynamo.send(new UpdateItemCommand(params))
      console.log(res2)
      console.log(song)
    }

    /**
     * Add User to Owners friend list
     */
    console.log(`Adding ${user.userId} to ${b.userId} 's friend list ..`)

    const res3 = await dynamo.send(
      new GetItemCommand({
        TableName: USER_TABLE_NAME, Key: { userId: { S: b.userId } }
      })
    )
    if (!res3.Item) { console.error(`Could not find this creator with userId: ${b.userId}`); return }
    const owner =  unmarshall(res3.Item!) as _User
    console.log(owner.friendIds)

    if (owner.friendIds && owner.friendIds.includes(user.userId)) {
      console.log(console.log(`you are already friends with ${user.userId}, nothing to add.`)  )
    } else {
      if (owner.friendIds && owner.friendIds.length > 0) owner.friendIds!.push(user.userId)
      else owner.friendIds = [user.userId]

      const params = updateDynamoUtil({ 
        table: USER_TABLE_NAME, 
        key: { userId: b.userId },
        item: { friendIds: owner.friendIds }
      })
      const res2 = await dynamo.send(new UpdateItemCommand(params))
      console.log(res2)
      console.log(owner)
      console.log(`friend added to owner.`)
    }

    /**
     * Add Owner to Users friend list
     */
    console.log(`Adding ${b.userId} to ${user.userId} 's friend list ..`)
    if (user.friendIds && user.friendIds.includes(owner.userId)) {
      if (owner.friendIds && owner.friendIds.includes(user.userId)) {
        console.log(console.log(`owner is already friends with you, nothing to add.`)  )
      }
    } else {
      if (user.friendIds && user.friendIds.length > 0) user.friendIds!.push(user.userId)
      else user.friendIds = [user.userId]

      const params = updateDynamoUtil({ 
        table: USER_TABLE_NAME, 
        key: { userId: user.userId },
        item: { friendIds: user.friendIds }
      })
      const res2 = await dynamo.send(new UpdateItemCommand(params))
      console.log(res2)
      console.log(user)
      console.log(`friend added to user.`)
    }
  } else {
    console.log(`No user exists with email: ${email}, sending email invite ..`)

    const today = new Date()
    today.setHours(today.getHours() + (24 * 7))

    const res2 = await dynamo.send(
      new PutItemCommand({
        TableName: INVITE_TABLE_NAME, 
        Item: marshall({
          inviteId: uuidv4(),
          from: b.userId,
          to: email,
          newUserId: `usr_${uuidv4()}`,
          shared: b.songId,
          ttl: today.getTime() / 1000
        })
      })
    )
    if (!res2) { console.error(`ERROR: could not put an invite in invite table`); return }

    // const ses = new SESClient({})
    // const res3 = await ses.send(new SendEmailCommand({
    //   Source: "no-reply@oslyn.io",
    //   ConfigurationSetName: "oslyn", // might not need
    //   Destination: { 
    //     ToAddresses: [ email ],
    //     CcAddresses: [ 'hello@oslyn.io' ],
    //     BccAddresses: [ "dominic.fung@icloud.com" ] 
    //   },
    //   Message: {
    //     Subject: { Data: "You've been invited! @tabs.oslyn.io" },
    //     Body: {
    //       Html: {
    //         Charset: "UTF-8",
    //         Data: (await generateEmail()).html
    //       }
    //     }  
    //   } 
    // }))

    // console.log(res3)
  }

  if (hasSubstring(event.info.selectionSetList, "creator")) {
    const res3 = await dynamo.send(
      new GetItemCommand({
        TableName: USER_TABLE_NAME, Key: { userId: { S: song.userId } }
      })
    )
    if (!res3.Item) { console.error(`Could not find this creator with userId: ${song.userId}`); return }

    let user = unmarshall(res3.Item) as User
    if (!user.labelledRecording) user.labelledRecording = []
    if (!user.songsCreated) user.songsCreated = []
    if (!user.editHistory) user.editHistory = []
    if (!user.likedSongs) user.likedSongs = []
    if (!user.friends) user.friends = []

    song.creator = user
  }

  if (hasSubstring(event.info.selectionSetList, "editors") && song.editorIds && song.editorIds.length > 0) {
    console.log("getting shareSong/editors ..")
    const uniq = [...new Set(song.editorIds!)]

    const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
    if (res1.Responses![USER_TABLE_NAME]) song.editors = res1.Responses![USER_TABLE_NAME].map((u) => { 
      let user = unmarshall(u) as User

      if (!user.labelledRecording) user.labelledRecording = []
      if (!user.songsCreated) user.songsCreated = []
      if (!user.editHistory) user.editHistory = []
      if (!user.likedSongs) user.likedSongs = []
      if (!user.friends) user.friends = []

      return user
    })
    else { song.editors = [] }
  } else { song.editors = [] }

  if (hasSubstring(event.info.selectionSetList, "viewers") && song.viewerIds && song.viewerIds.length > 0) {
    console.log("getting shareSong/viewers ..")
    const uniq = [...new Set(song.viewerIds!)]

    const keys = uniq.map((s) => { return { userId: { S: s } } as { [userId: string]: any } })
    console.log(keys)

    const res1 = await dynamo.send(new BatchGetItemCommand({
      RequestItems: {[USER_TABLE_NAME]: { Keys: keys }}
    }))
    console.log(res1)
    if (!res1.Responses) { console.error(`ERROR: unable to BatchGet userId. ${res1.$metadata}`); return  } 
    if (res1.Responses![USER_TABLE_NAME]) song.viewers = res1.Responses![USER_TABLE_NAME].map((u) => {
      let user = unmarshall(u) as User

      if (!user.labelledRecording) user.labelledRecording = []
      if (!user.songsCreated) user.songsCreated = []
      if (!user.editHistory) user.editHistory = []
      if (!user.likedSongs) user.likedSongs = []
      if (!user.friends) user.friends = []

      return user
    })
    else { song.viewers = [] }
  } else { song.viewers = [] }

  console.log(song)
  return song
}