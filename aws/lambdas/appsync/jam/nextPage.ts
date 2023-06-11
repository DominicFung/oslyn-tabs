import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { updateDynamoUtil } from '../../util/dynamo'

const JAM_TABLE_NAME = process.env.JAM_TABLE_NAME || ''

// type _JamSession = JamSession & {
//   setListId: string
// }

// type _SetList = SetList & {
//   userId: string
//   songs: _JamSong[]
// }

// type _JamSong = JamSong & {
//   songId: string
// }

export const handler = async (event: AppSyncResolverEvent<{
  jamSessionId: string, page: number
}, null>) => {
  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  if (!b.jamSessionId) { console.error(`b.creatorId is empty`); return }

  const dynamo = new DynamoDBClient({})

  // let page = {
  //   jamSessionId: b.jamSessionId,
  //   songId: "",
  //   page: 0
  // }

  // const res0 = await dynamo.send(
  //   new GetItemCommand({
  //     TableName: JAM_TABLE_NAME, Key: { jamSessionId: { S: b.jamSessionId } }
  //   })
  // )
  // if (!res0.Item) { console.error(`ERROR: jamSessionId not found: ${b.jamSessionId}`); return }
  // const jamSession = unmarshall(res0.Item) as _JamSession
  // if (jamSession.currentPage && jamSession.currentSong) {
  //   page.page = jamSession.currentPage
  // }

  console.log(`page: ${b.page}`)


  const params = updateDynamoUtil({ 
    table: JAM_TABLE_NAME, 
    key: { jamSessionId: b.jamSessionId },
    item: { currentPage: b.page } 
  })

  console.log(params)
  console.log("params calculated")
  const res1 = await dynamo.send(new UpdateItemCommand(params))
  
  console.log("res1 result")
  console.log(res1)

  return { jamSessionId: b.jamSessionId, page: b.page }
}