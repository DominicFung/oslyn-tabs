import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'

const RECORDING_TABLE_NAME = process.env.RECORDING_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, sessionId: string, recordingId: string, jamId: string,
  samplingRate: number, fileName: string, 
  songs: { songId: string, startTime: string, pageturns: string[] }[]
}, null>) => {

  console.log(event)
  const b = event.arguments
  if (!b) { console.error(`event.arguments is empty`); return }
  const dynamo = new DynamoDBClient({})

  console.log(`recordingId ${b.recordingId}`)

  if (!b.jamId) { console.error(`b.jamId is empty`); return }
  if (!b.sessionId) { console.error(`b.sessionId is empty`); return }
  if (!b.recordingId) { console.error(`b.recordingId is empty`); return }
  if (!b.samplingRate) { console.error(`b.samplingRate is empty or 0`); return }
  if (!b.fileName) { console.error(`b.fileName is empty`); return }
  if (!b.userId) { console.error(`b.userId is empty`); return }

  console.log(b.songs)

  let recording = {
    sessionId: b.sessionId, recordingId: b.recordingId, userId: b.userId, jamId: b.jamId,
    samplingRate: b.samplingRate, fileName: b.fileName, songs: [],
    createDate: Date.now(), updateDate: Date.now(), status: "", comment: ""
  } as any

  if (b.songs) recording.songs = b.songs

  const res1 = await dynamo.send(
    new PutItemCommand({
      TableName: RECORDING_TABLE_NAME,
      Item: marshall(recording)
    })
  )
  console.log(res1)
  return recording
}