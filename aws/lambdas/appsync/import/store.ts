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
    ConsistentRead: true,
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
): Promise<ChordImportRecord | null> {
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
    const res = await dynamo.send(new UpdateItemCommand({
      TableName: CHORD_IMPORT_TABLE_NAME,
      Key: { requestId: { S: requestId } },
      UpdateExpression: `SET ${sets.join(', ')}`,
      ExpressionAttributeNames: names,
      ExpressionAttributeValues: marshall(values),
      ...(condition ? { ConditionExpression: condition } : {}),
      // ALL_NEW is the updated item. A follow-up GetItem is eventually consistent
      // and was publishing the pre-update row, so the jam never saw DONE.
      ReturnValues: 'ALL_NEW',
    }))
    if (!res.Attributes) return null
    return unmarshall(res.Attributes) as ChordImportRecord
  } catch (error) {
    const name = (error as { name?: string }).name
    if (name === 'ConditionalCheckFailedException') return null
    throw error
  }
}
