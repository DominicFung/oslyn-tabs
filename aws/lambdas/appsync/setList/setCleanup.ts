import { AttributeValue, BatchWriteItemCommand, DeleteItemCommand, DynamoDBClient, GetItemCommand, QueryCommand, UpdateItemCommand, WriteRequest } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { _SetList } from '../../type'
import { scanAll } from '../../util/batch'

const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''
const RECORDING_TABLE_NAME = process.env.RECORDING_TABLE_NAME || ''
const CHORD_IMPORT_TABLE_NAME = process.env.CHORD_IMPORT_TABLE_NAME || ''

export async function loadOwnedSet(
  dynamo: DynamoDBClient,
  setListId: string,
  userId: string
): Promise<_SetList | undefined> {
  const res = await dynamo.send(new GetItemCommand({
    TableName: SETLIST_TABLE_NAME,
    Key: { setListId: { S: setListId } },
  }))
  if (!res.Item) return undefined
  const setList = unmarshall(res.Item) as _SetList
  if (setList.userId !== userId) return undefined
  return setList
}

export async function jamsForSet(dynamo: DynamoDBClient, setListId: string) {
  const items = await scanAll(dynamo, {
    TableName: JAM_TABLE_NAME,
    FilterExpression: 'setListId = :sid',
    ExpressionAttributeValues: { ':sid': { S: setListId } },
    ProjectionExpression: 'jamSessionId, setListId, userId, endDate',
  })
  return items.map((item) => unmarshall(item) as { jamSessionId: string, endDate?: number })
}

/**
 * Deletes the jam row plus recordings and chord-import requests for that room.
 * The set and its songs are left alone.
 */
export async function deleteJamRoom(dynamo: DynamoDBClient, jamSessionId: string) {
  await deleteRecordings(dynamo, jamSessionId)
  await deleteImports(dynamo, jamSessionId)
  await dynamo.send(new DeleteItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: jamSessionId } },
  }))
}

async function batchDelete(dynamo: DynamoDBClient, table: string, requests: WriteRequest[]) {
  for (let i = 0; i < requests.length; i += 25) {
    let pending = requests.slice(i, i + 25)
    for (let attempt = 0; attempt < 6 && pending.length; attempt++) {
      const res = await dynamo.send(new BatchWriteItemCommand({
        RequestItems: { [table]: pending },
      }))
      pending = res.UnprocessedItems?.[table] || []
    }
  }
}

async function deleteRecordings(dynamo: DynamoDBClient, jamSessionId: string) {
  if (!RECORDING_TABLE_NAME) return
  const keys: WriteRequest[] = []
  let start: Record<string, AttributeValue> | undefined
  do {
    const res = await dynamo.send(new QueryCommand({
      TableName: RECORDING_TABLE_NAME,
      IndexName: 'jamId',
      KeyConditionExpression: 'jamId = :jam',
      ExpressionAttributeValues: { ':jam': { S: jamSessionId } },
      ProjectionExpression: 'recordingId, updateDate',
      ExclusiveStartKey: start,
    }))
    for (const item of res.Items || []) {
      if (!item.recordingId?.S || item.updateDate?.N == null) continue
      keys.push({ DeleteRequest: { Key: { recordingId: item.recordingId, updateDate: item.updateDate } } })
    }
    start = res.LastEvaluatedKey
  } while (start)
  await batchDelete(dynamo, RECORDING_TABLE_NAME, keys)
}

async function deleteImports(dynamo: DynamoDBClient, jamSessionId: string) {
  if (!CHORD_IMPORT_TABLE_NAME) return
  const keys: WriteRequest[] = []
  for (const status of ['PENDING', 'IMPORTING', 'DONE', 'FAILED']) {
    let start: Record<string, AttributeValue> | undefined
    do {
      const res = await dynamo.send(new QueryCommand({
        TableName: CHORD_IMPORT_TABLE_NAME,
        IndexName: 'status',
        KeyConditionExpression: '#status = :status',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':status': { S: status } },
        ProjectionExpression: 'requestId, jamId',
        ExclusiveStartKey: start,
      }))
      for (const item of res.Items || []) {
        if (item.jamId?.S === jamSessionId && item.requestId?.S) {
          keys.push({ DeleteRequest: { Key: { requestId: item.requestId } } })
        }
      }
      start = res.LastEvaluatedKey
    } while (start)
  }
  await batchDelete(dynamo, CHORD_IMPORT_TABLE_NAME, keys)
}

function remainingSetIds(raw: AttributeValue | undefined, setListId: string): { kind: 'L' | 'SS', values: string[] } | undefined {
  if (!raw) return undefined
  if (raw.L) {
    const original = raw.L.map((v) => v.S).filter((v): v is string => !!v)
    if (!original.includes(setListId)) return undefined
    return { kind: 'L', values: original.filter((id) => id !== setListId) }
  }
  if (raw.SS) {
    if (!raw.SS.includes(setListId)) return undefined
    return { kind: 'SS', values: raw.SS.filter((id) => id !== setListId) }
  }
  return undefined
}

export async function removeSetFromBands(dynamo: DynamoDBClient, setListId: string) {
  const items = await scanAll(dynamo, {
    TableName: BAND_TABLE_NAME,
    FilterExpression: 'contains(setIds, :sid)',
    ExpressionAttributeValues: { ':sid': { S: setListId } },
    ProjectionExpression: 'bandId, setIds',
  })

  for (const item of items) {
    const bandId = item.bandId?.S
    if (!bandId) continue
    const next = remainingSetIds(item.setIds, setListId)
    if (!next) continue

    if (next.values.length === 0) {
      await dynamo.send(new UpdateItemCommand({
        TableName: BAND_TABLE_NAME,
        Key: { bandId: { S: bandId } },
        UpdateExpression: 'REMOVE setIds',
      }))
      continue
    }

    const value: AttributeValue = next.kind === 'SS'
      ? { SS: next.values }
      : { L: next.values.map((id) => ({ S: id })) }

    await dynamo.send(new UpdateItemCommand({
      TableName: BAND_TABLE_NAME,
      Key: { bandId: { S: bandId } },
      UpdateExpression: 'SET setIds = :ids',
      ExpressionAttributeValues: { ':ids': value },
    }))
  }
}
