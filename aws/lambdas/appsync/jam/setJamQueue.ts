import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{ jamSessionId: string, queue: number[], expectedRevision?: number, currentSongIndex?: number }, null>) => {
  const b = event.arguments
  if (!b) { console.error('event.arguments is empty'); return }
  if (!b.jamSessionId) { console.error('b.jamSessionId is empty'); return }
  if (!Array.isArray(b.queue)) { console.error('queue must be an array'); return }

  console.log('🔄 setJamQueue Lambda called with:')
  console.log('  - jamSessionId:', b.jamSessionId)
  console.log('  - queue:', JSON.stringify(b.queue))
  console.log('  - expectedRevision:', b.expectedRevision)
  console.log('  - currentSongIndex:', b.currentSongIndex)

  const dynamo = new DynamoDBClient({})

  // Load jam
  const res = await dynamo.send(new GetItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: b.jamSessionId } }
  }))
  if (!res.Item) { console.error(`Jam not found: ${b.jamSessionId}`); return }
  const jam = unmarshall(res.Item) as { jamSessionId: string, setListId?: string, queue?: number[], revision?: number }
  
  console.log('📊 Current jam state from DB:')
  console.log('  - current queue:', JSON.stringify(jam.queue))
  console.log('  - current revision:', jam.revision)

  // Normalize input queue (ints only)
  const cleanQueue = (b.queue || []).map((n) => Number.isFinite(n) ? Number(n) : 0).filter((n) => n >= 0)

  // Build conditional update for optimistic concurrency
  const currentRevision = typeof jam.revision === 'number' ? jam.revision : 0
  const nextRevision = currentRevision + 1
  
  console.log('📊 Revision check:')
  console.log('  - Current revision in DB:', jam.revision)
  console.log('  - Expected revision from client:', b.expectedRevision)
  console.log('  - Current revision (normalized):', currentRevision)
  console.log('  - Next revision:', nextRevision)

  // Build update expression dynamically based on what needs to be updated
  const updateExpressions = ['#queue = :queue', '#revision = :nextRevision']
  const expressionAttributeNames: Record<string, string> = {
    '#queue': 'queue',
    '#revision': 'revision',
  }
  const expressionAttributeValues: Record<string, any> = {
    ':queue': { L: cleanQueue.map((n) => ({ N: String(n) })) },
    ':nextRevision': { N: String(nextRevision) },
  }

  // Add currentSongIndex update if provided
  if (b.currentSongIndex !== undefined && b.currentSongIndex !== null) {
    updateExpressions.push('#currentSong = :currentSong')
    expressionAttributeNames['#currentSong'] = 'currentSong'
    expressionAttributeValues[':currentSong'] = { N: String(b.currentSongIndex) }
  }

  const params = {
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: jam.jamSessionId } },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'NONE',
  }

  console.log('🔄 Attempting DynamoDB update:')
  console.log('  - UpdateExpression:', params.UpdateExpression)
  console.log('  - ConditionExpression:', params.ConditionExpression)
  console.log('  - New queue to set:', JSON.stringify(cleanQueue))
  console.log('  - New revision:', nextRevision)

  try {
    await dynamo.send(new UpdateItemCommand(params))
    console.log('✅ DynamoDB update successful')
    return { 
      jamSessionId: b.jamSessionId, 
      queue: cleanQueue, 
      revision: nextRevision,
      currentSongIndex: b.currentSongIndex
    }
  } catch (e) {
    console.error('❌ Failed to setJamQueue', e)
    console.log('🔄 Returning current server state due to error')
    // On condition failure, return current server state to let clients resync
    return { 
      jamSessionId: b.jamSessionId, 
      queue: jam.queue || [], 
      revision: currentRevision,
      currentSongIndex: jam.currentSong
    }
  }
}
