import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { AppSyncResolverEvent } from 'aws-lambda'

import { _JamSession } from '../../type'
import { idList, scanAll } from '../../util/batch'
import { hydrateJamSessions } from './hydrateJamSessions'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

/**
 * Jam rooms created by this user, including PRIVATE.
 * Reads only. Does not change policy.
 */
export const handler = async (event: AppSyncResolverEvent<{
  userId: string
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b?.userId) { console.error('b.userId is empty'); return [] }

  const dynamo = new DynamoDBClient({})
  const items = await scanAll(dynamo, {
    TableName: JAM_TABLE_NAME,
    FilterExpression: 'userId = :uid',
    ExpressionAttributeValues: { ':uid': { S: b.userId } },
  })

  const sessions = items.map((s) => {
    const jam = unmarshall(s) as _JamSession
    jam.activeIds = idList(jam.activeIds)
    return jam
  }).filter((jam) => !jam.endDate)

  return hydrateJamSessions(dynamo, sessions, event.info.selectionSetList)
}
