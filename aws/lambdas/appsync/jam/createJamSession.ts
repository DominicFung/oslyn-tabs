import { DynamoDBClient, PutItemCommand, GetItemCommand, BatchGetItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

import { v4 as uuidv4 } from 'uuid'
import { hasSubstring } from '../../util/dynamo'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''
const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const SONG_TABLE_NAME = process.env.SONG_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

// Generate a short, unique PIN code
function generateJamPin(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Check if a PIN is already in use
async function isPinInUse(dynamo: DynamoDBClient, pin: string): Promise<boolean> {
  try {
    const result = await dynamo.send(new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: pin } }
    }))
    return !!result.Item
  } catch (error) {
    console.error('Error checking PIN availability:', error)
    return true // Assume in use if error occurs
  }
}

// Generate a unique PIN
async function generateUniquePin(dynamo: DynamoDBClient): Promise<string> {
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const pin = generateJamPin()
    const inUse = await isPinInUse(dynamo, pin)
    
    if (!inUse) {
      return pin
    }
    
    attempts++
  }
  
  // Fallback to UUID if we can't generate a unique PIN
  console.warn('Could not generate unique PIN, falling back to UUID')
  return uuidv4()
}

export const handler = async (event: any) => {
  console.log(JSON.stringify(event, null, 2))
  const b = event.arguments
  if (!b) { console.error('event.arguments is empty'); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }
  if (!b.setListId) { console.error(`b.setListId is empty`); return }

  const policy = b.policy ||  "PUBLIC_VIEW" //"PRIVATE"

  const dynamo = new DynamoDBClient({})
  const jamSessionId = uuidv4() // Keep UUID as the actual jam session ID
  const pin = await generateUniquePin(dynamo) // Generate separate PIN

  const res0 = await dynamo.send(
    new GetItemCommand({
      TableName: USER_TABLE_NAME,
      Key: { userId: { S: b.userId } }
    })
  )
  if (!res0.Item) { console.error(`ERROR: userId not found: ${b.userId}`); return }

  const res1 = await dynamo.send(
    new GetItemCommand({
      TableName: SETLIST_TABLE_NAME,
      Key: { setListId: { S: b.setListId } }
    })
  )
  if (!res1.Item) { console.error(`ERROR: setListId not found: ${b.setListId}`); return }
  
  // Get the setlist to extract description
  const setList = unmarshall(res1.Item)
  const setListDescription = setList.description || null
  
  // Use provided description or fall back to setlist description
  const jamSessionDescription = b.description || setListDescription
  
  let jamSession = {
    jamSessionId, 
    setListId: b.setListId, 
    userId: b.userId,
    bandId: b.bandId || null, // Add bandId field, default to null if not provided
    pin, // Add PIN to jam session record

    currentSong: 0, currentPage: 0,
    startDate: Date.now(),
    policy: policy,
    description: jamSessionDescription, // Use description from setlist or provided

    pageSettings: {
      pageMax: 3, pageMin: 2
    },

    active: []
  } as any

  // Store the jam session
  const res2 = await dynamo.send(new PutItemCommand({
    TableName: JAM_TABLE_NAME, Item: marshall(jamSession)
  }))
  console.log(res2)

  // Store PIN-to-JamSessionId mapping
  const pinMapping = {
    pin: pin,
    jamSessionId: jamSessionId,
    createdAt: Date.now(),
    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  }
  
  const res3 = await dynamo.send(new PutItemCommand({
    TableName: JAM_TABLE_NAME, 
    Item: marshall(pinMapping)
  }))
  console.log('PIN mapping stored:', res3)

  if (hasSubstring(event.info.selectionSetList, "setList")) {
    let setList = unmarshall(res1.Item) as any
    console.log(setList)

    if (hasSubstring(event.info.selectionSetList, "setList/songs")) {
      const songIds = setList.songs.map((s: any) => { return s.songId as string })
      const uniq = Array.from(new Set(songIds))
  
      const res3 = await dynamo.send(new BatchGetItemCommand({
        RequestItems: {
          [SONG_TABLE_NAME]: {
            Keys: uniq.map((songId) => ({ songId: { S: songId } })) as any
          }
        }
      }))
      console.log(res3)
      if (res3.Responses) {
        const songs = res3.Responses![SONG_TABLE_NAME].map((s) => unmarshall(s) as any)
        setList.songs = setList.songs.map((js: any) => {
          const song = songs.find((s) => s.songId === js.songId)
          return { ...js, song }
        })
      }
    }

    jamSession.setList = setList
  }

  if (hasSubstring(event.info.selectionSetList, "admins")) {
    const admins = [unmarshall(res0.Item) as any]
    jamSession.admins = admins
  }

  return jamSession
}