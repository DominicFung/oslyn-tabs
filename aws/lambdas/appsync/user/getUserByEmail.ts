import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { AppSyncResolverEvent } from 'aws-lambda'

import { _User } from '../../type'

const USER_TABLE_NAME = process.env.USER_TABLE_NAME || ''

/** Index keys to try. The email GSI stores the address createUser wrote, which may not be lowercased. */
export function emailLookupKeys(email: string): string[] {
  const trimmed = email.trim()
  if (!trimmed || !trimmed.includes('@')) return []
  const lower = trimmed.toLowerCase()
  return trimmed === lower ? [trimmed] : [trimmed, lower]
}

export const handler = async (event: AppSyncResolverEvent<{ email?: string | null }, null>) => {
  const email = event.arguments?.email || ''
  const keys = emailLookupKeys(email)
  if (!keys.length) { console.error('email is empty'); return }

  const dynamo = new DynamoDBClient({})
  for (const key of keys) {
    const res = await dynamo.send(new QueryCommand({
      TableName: USER_TABLE_NAME,
      IndexName: 'email',
      KeyConditionExpression: 'email = :key',
      ExpressionAttributeValues: { ':key': { S: key } },
    }))
    const item = res.Items?.[0]
    if (!item) continue
    const user = unmarshall(item) as _User
    if (!user.providers) user.providers = []
    return user
  }
  return null
}
