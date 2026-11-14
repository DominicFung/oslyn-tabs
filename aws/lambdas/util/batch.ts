import {
  AttributeValue,
  BatchGetItemCommand,
  BatchGetItemCommandInput,
  BatchGetItemCommandOutput,
  DynamoDBClient,
  ScanCommand,
  ScanCommandInput,
} from '@aws-sdk/client-dynamodb'
import { chunk } from './dynamo'

/** DynamoDB string sets unmarshal as Set, lists as arrays. */
export function idList(value: unknown): string[] {
  const items = Array.isArray(value) ? value : value instanceof Set ? [...value] : []
  return items.filter((id): id is string => typeof id === 'string' && id.length > 0)
}

const BATCH_LIMIT = 100
const MAX_ATTEMPTS = 8

function dedupeKeys(keys: Record<string, AttributeValue>[]): Record<string, AttributeValue>[] {
  const seen = new Set<string>()
  const unique: Record<string, AttributeValue>[] = []

  for (const key of keys) {
    if (!key) continue
    const entries = Object.entries(key)
    if (entries.length === 0) continue
    const blank = entries.some(([, value]) => !value || (typeof value.S === 'string' && value.S.length === 0))
    if (blank) continue
    const id = JSON.stringify(key)
    if (seen.has(id)) continue
    seen.add(id)
    unique.push(key)
  }

  return unique
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * BatchGetItem allows at most 100 keys. UnprocessedKeys are retried with backoff.
 */
export async function batchGetAll(
  dynamo: DynamoDBClient,
  tableName: string,
  keys: Record<string, AttributeValue>[],
  options?: { projectionExpression?: string }
): Promise<Record<string, AttributeValue>[]> {
  const unique = dedupeKeys(keys)
  if (unique.length === 0) return []

  const items: Record<string, AttributeValue>[] = []

  for (const group of chunk(unique, BATCH_LIMIT)) {
    let request: BatchGetItemCommandInput['RequestItems'] | undefined = {
      [tableName]: {
        Keys: group,
        ...(options?.projectionExpression ? { ProjectionExpression: options.projectionExpression } : {}),
      },
    }

    for (let attempt = 0; attempt < MAX_ATTEMPTS && request; attempt++) {
      const res: BatchGetItemCommandOutput = await dynamo.send(new BatchGetItemCommand({ RequestItems: request }))
      const found = res.Responses?.[tableName]
      if (found) items.push(...found)

      const pending = res.UnprocessedKeys?.[tableName]?.Keys
      if (!pending || pending.length === 0) {
        request = undefined
        break
      }

      console.log(`BatchGetItem ${tableName}: ${pending.length} unprocessed keys, retry ${attempt + 1}`)
      await sleep(Math.min(50 * (2 ** attempt), 1000))
      request = res.UnprocessedKeys
    }

    const leftover = request?.[tableName]?.Keys?.length || 0
    if (leftover > 0) {
      throw new Error(`BatchGetItem left ${leftover} unprocessed keys on ${tableName}`)
    }
  }

  return items
}

export async function scanAll(
  dynamo: DynamoDBClient,
  input: Omit<ScanCommandInput, 'ExclusiveStartKey'>
): Promise<Record<string, AttributeValue>[]> {
  const items: Record<string, AttributeValue>[] = []
  let startKey: Record<string, AttributeValue> | undefined

  do {
    const res = await dynamo.send(new ScanCommand({ ...input, ExclusiveStartKey: startKey }))
    if (res.Items) items.push(...res.Items)
    startKey = res.LastEvaluatedKey
  } while (startKey)

  return items
}
