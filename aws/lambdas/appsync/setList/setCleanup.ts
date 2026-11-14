import { AttributeValue, DeleteItemCommand, DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { _SetList } from '../../type'
import { scanAll } from '../../util/batch'

const SETLIST_TABLE_NAME = process.env.SETLIST_TABLE_NAME || ''
const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''
const BAND_TABLE_NAME = process.env.BAND_TABLE_NAME || ''

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
 * Mark the jam ended, then delete the row. Policy is left untouched.
 * Songs are not modified.
 */
export async function endAndDeleteJam(dynamo: DynamoDBClient, jamSessionId: string) {
  await dynamo.send(new UpdateItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: jamSessionId } },
    UpdateExpression: 'SET endDate = :end',
    ExpressionAttributeValues: { ':end': { N: `${Date.now()}` } },
  }))
  await dynamo.send(new DeleteItemCommand({
    TableName: JAM_TABLE_NAME,
    Key: { jamSessionId: { S: jamSessionId } },
  }))
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
