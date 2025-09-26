import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: any) => {
  console.log(JSON.stringify(event, null, 2))
  const b = event.arguments
  if (!b) { console.error('event.arguments is empty'); return }
  if (!b.pin) { console.error('b.pin is empty'); return }

  const dynamo = new DynamoDBClient({})

  try {
    // First, look up the PIN mapping to get the jam session ID
    const pinResult = await dynamo.send(new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { pin: { S: b.pin } }
    }))

    if (!pinResult.Item) {
      console.error(`PIN not found: ${b.pin}`)
      return null
    }

    const pinMapping = unmarshall(pinResult.Item)
    const jamSessionId = pinMapping.jamSessionId

    // Check if PIN has expired
    if (pinMapping.expiresAt && Date.now() > pinMapping.expiresAt) {
      console.error(`PIN expired: ${b.pin}`)
      return null
    }

    // Now get the actual jam session using the jam session ID
    const jamResult = await dynamo.send(new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: jamSessionId } }
    }))

    if (!jamResult.Item) {
      console.error(`Jam session not found for PIN ${b.pin}: ${jamSessionId}`)
      return null
    }

    const jamSession = unmarshall(jamResult.Item)
    console.log(`Successfully found jam session ${jamSessionId} for PIN ${b.pin}`)
    
    // Ensure required fields are initialized
    if (!jamSession.admins) jamSession.admins = []
    if (!jamSession.members) jamSession.members = []
    if (!jamSession.guests) jamSession.guests = []
    if (!jamSession.active) jamSession.active = []
    if (!jamSession.queue) jamSession.queue = []
    if (jamSession.revision === undefined || jamSession.revision === null) jamSession.revision = 0
    
    return jamSession

  } catch (error) {
    console.error('Error looking up jam session by PIN:', error)
    return null
  }
}

