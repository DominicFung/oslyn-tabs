import { AppSyncResolverEvent } from 'aws-lambda'
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { RecordingPageTurn, RecordingPageTurnInput, RecordingSongSegment, turn } from '../../API'



const RECORDING_TABLE_NAME = process.env.RECORDING_TABLE_NAME || ''

export const handler = async (event: AppSyncResolverEvent<{
  userId: string, sessionId: string, recordingId: string, jamId: string,
  samplingRate: number, fileName: string, 
  songs: { songId: string, startTime: string, pageturns: RecordingPageTurnInput[] }[]
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
    samplingRate: b.samplingRate, fileName: b.fileName, songs: [] as RecordingSongSegment[],
    createDate: Date.now(), updateDate: Date.now(), status: "", comment: ""
  }

  if (b.songs) { 
    recording.songs = b.songs as unknown as RecordingSongSegment[]

    /* classify if turn is FORWARD, BACK or SKIP
        FORWARD => move up 1 page
        BACK => move back 1 page
        SKIP => go anywhere within the song
    */

    console.log(JSON.stringify(recording.songs))

    for (let i=0; i<recording.songs.length; i++) {
      let cpage = recording.songs[i].pageturns[0]!.page || 0
      recording.songs[i].pageturns[0]!.turn = turn.START
      for (let j=1; j<recording.songs[i].pageturns.length; j++) {
        let r = recording.songs[i].pageturns[j] as RecordingPageTurn
        if (cpage+1 === r.page) recording.songs[i].pageturns[j]!.turn = turn.FORWARD
        else if (cpage-1 === r.page) recording.songs[i].pageturns[j]!.turn = turn.BACK
        else recording.songs[i].pageturns[j]!.turn = turn.SKIP
      }
    }
    
    console.log(JSON.stringify(recording.songs))
  }


  const res1 = await dynamo.send(
    new PutItemCommand({
      TableName: RECORDING_TABLE_NAME,
      Item: marshall(recording)
    })
  )
  console.log(res1)
  return recording
}