import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb'
import { unmarshall } from '@aws-sdk/util-dynamodb'
import { AppSyncResolverEvent } from 'aws-lambda'

import { _JamSession } from '../../type'
import { idList } from '../../util/batch'
import { hydrateJamSessions } from './hydrateJamSessions'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{}, null>) => {
  console.log(event)
  const dynamo = new DynamoDBClient({})

  const res0 = await dynamo.send(
    new ScanCommand({
      TableName: JAM_TABLE_NAME,
      Select: "ALL_ATTRIBUTES",
      ScanFilter: {
        policy: {
          AttributeValueList: [{ S: "PUBLIC" }],
          ComparisonOperator: "BEGINS_WITH"
        }
      }
    })
  )

  if (!res0) { console.log("ERROR: empty scan response"); return }
  if (res0.Items && res0.Items.length === 0) return []

  const sessions = res0.Items!.map((s) => {
    const jam = unmarshall(s) as _JamSession
    jam.activeIds = idList(jam.activeIds)
    return jam
  })

  return hydrateJamSessions(dynamo, sessions, event.info.selectionSetList)
}
