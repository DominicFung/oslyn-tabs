import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string
  description: string
}, null>) => {
  console.log(JSON.stringify(event))
  const b = event.arguments
  if (!b?.jamSessionId) { console.error('jamSessionId is empty'); return null }
  if (!b.description) { console.error('description is empty'); return null }

  const dynamo = new DynamoDBClient({})

  try {
    const getRes = await dynamo.send(new GetItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } }
    }))

    if (!getRes.Item) {
      console.error(`Jam session not found: ${b.jamSessionId}`)
      return null
    }

    const updateRes = await dynamo.send(new UpdateItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: b.jamSessionId } },
      UpdateExpression: 'SET description = :description',
      ExpressionAttributeValues: {
        ':description': { S: b.description }
      },
      ReturnValues: 'ALL_NEW'
    }))

    if (!updateRes.Attributes) {
      console.error('Failed to update jam session')
      return null
    }

    const updatedJam = unmarshall(updateRes.Attributes) as any
    if (!updatedJam.admins) updatedJam.admins = []
    if (!updatedJam.members) updatedJam.members = []
    if (!updatedJam.guests) updatedJam.guests = []
    if (!updatedJam.active) updatedJam.active = []
    if (!updatedJam.queue) updatedJam.queue = []
    return updatedJam
  } catch (error) {
    console.error('Error updating jam session description:', error)
    return null
  }
}
