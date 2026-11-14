import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, queue: number[], expectedRevision?: number, currentSongIndex?: number
}, null>) => {
  const b = event.arguments
  if (!b) { console.error('event.arguments is empty'); return }
  if (!b.jamSessionId) { console.error('b.jamSessionId is empty'); return }
  if (!Array.isArray(b.queue)) { console.error('queue must be an array'); return }

  console.log('setJamQueue', b.jamSessionId, 'expectedRevision', b.expectedRevision, 'currentSongIndex', b.currentSongIndex)

  const dynamo = new DynamoDBClient({})

  const res = await dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } }
  }))
  if (!res.Item) { console.error(`Jam not found: ${b.jamSessionId}`); return }
  const jam = unmarshall(res.Item) as { jamSessionId: string, queue?: number[], revision?: number }

  const cleanQueue = (b.queue || []).map((n) => Number.isFinite(n) ? Number(n) : 0).filter((n) => n >= 0)
  const currentRevision = typeof jam.revision === 'number' ? jam.revision : 0
  const nextRevision = currentRevision + 1

  const updateExpressions = ['#queue = :queue', '#revision = :nextRevision']
  const expressionAttributeNames: Record<string, string> = {
    '#queue': 'queue',
    '#revision': 'revision',
  }
  const expressionAttributeValues: Record<string, any> = {
    ':queue': { L: cleanQueue.map((n) => ({ N: String(n) })) },
    ':nextRevision': { N: String(nextRevision) },
  }

  if (b.currentSongIndex !== undefined && b.currentSongIndex !== null) {
    updateExpressions.push('#currentSong = :currentSong')
    expressionAttributeNames['#currentSong'] = 'currentSong'
    expressionAttributeValues[':currentSong'] = { N: String(b.currentSongIndex) }
  }

  try {
    await dynamo.send(new UpdateItemCommand({
      TableName: JAM_TABLE_NAME,
      Key: { jamSessionId: { S: jam.jamSessionId } },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'NONE',
    }))
    return {
      jamSessionId: b.jamSessionId,
      queue: cleanQueue,
      revision: nextRevision,
      currentSongIndex: b.currentSongIndex
    }
  } catch (e) {
    console.error('Failed to setJamQueue', e)
    return {
      jamSessionId: b.jamSessionId,
      queue: jam.queue || [],
      revision: currentRevision,
      currentSongIndex: b.currentSongIndex
    }
  }
}
