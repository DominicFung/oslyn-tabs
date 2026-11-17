import { DynamoDBClient, GetItemCommand, PutItemCommand, QueryCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

export const CHORD_IMPORT_TABLE_NAME = process.env.CHORD_IMPORT_TABLE_NAME || ''

export type ChordImportStatus = 'PENDING' | 'IMPORTING' | 'DONE' | 'FAILED'

export type ChordImportRecord = {
  requestId: string
  userId: string
  songId: string
  jamId: string
  title: string
  artist?: string
  status: ChordImportStatus
  chosenUrl?: string
  error?: string
  chordSheet?: string
  createdAt: number
  updatedAt: number
}

export async function putImport(dynamo: DynamoDBClient, record: ChordImportRecord) {
  await dynamo.send(new PutItemCommand({
    TableName: CHORD_IMPORT_TABLE_NAME,
    Item: marshall(record, { removeUndefinedValues: true }),
  }))
}

export async function getImport(dynamo: DynamoDBClient, requestId: string): Promise<ChordImportRecord | undefined> {
  const res = await dynamo.send(new GetItemCommand({
    TableName: CHORD_IMPORT_TABLE_NAME,
    Key: { requestId: { S: requestId } },
  }))
  if (!res.Item) return undefined
  return unmarshall(res.Item) as ChordImportRecord
}

export async function listPending(dynamo: DynamoDBClient, limit: number): Promise<ChordImportRecord[]> {
  const res = await dynamo.send(new QueryCommand({
    TableName: CHORD_IMPORT_TABLE_NAME,
    IndexName: 'status',
    KeyConditionExpression: '#status = :pending',
    ExpressionAttributeNames: { '#status': 'status' },
    ExpressionAttributeValues: { ':pending': { S: 'PENDING' } },
    Limit: limit,
  }))
  return (res.Items || []).map((item) => unmarshall(item) as ChordImportRecord)
}

export async function setImportStatus(
  dynamo: DynamoDBClient,
  requestId: string,
  status: ChordImportStatus,
  extra: { chosenUrl?: string, error?: string, chordSheet?: string } = {},
  onlyFrom?: ChordImportStatus,
): Promise<boolean> {
  const names: Record<string, string> = { '#status': 'status', '#updatedAt': 'updatedAt' }
  const values: Record<string, any> = {
    ':status': status,
    ':updatedAt': Date.now(),
  }
  const sets = ['#status = :status', '#updatedAt = :updatedAt']
  if (extra.chosenUrl) {
    names['#chosenUrl'] = 'chosenUrl'
    values[':chosenUrl'] = extra.chosenUrl
    sets.push('#chosenUrl = :chosenUrl')
  }
  if (extra.error) {
    names['#error'] = 'error'
    values[':error'] = extra.error
    sets.push('#error = :error')
  }
  if (extra.chordSheet) {
    names['#chordSheet'] = 'chordSheet'
    values[':chordSheet'] = extra.chordSheet
    sets.push('#chordSheet = :chordSheet')
  }
  let condition: string | undefined
  if (onlyFrom) {
    values[':from'] = onlyFrom
    condition = '#status = :from'
  }
  try {
    await dynamo.send(new UpdateItemCommand({
      TableName: CHORD_IMPORT_TABLE_NAME,
      Key: { requestId: { S: requestId } },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: marshall(values),
      ...(condition ? { ConditionExpression: condition } : {}),
    }))
    return true
  } catch (error) {
    const name = (error as { name?: string }).name
    if (name === 'ConditionalCheckFailedException') return false
    throw error
  }
}
