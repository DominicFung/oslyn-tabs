import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as m from '@/../src/graphql/mutations'
import { Recording } from '@/../src/API'

export interface SaveRecordingRequest {
  sessionId: string
  userId: string
  fileName: string
  samplingRate: number
  pageturns: string[]
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as SaveRecordingRequest
  
  Amplify.configure(amplifyconfig)
  const client = generateClient()

  const recordingId = request.url.split("recording/")[1]
  console.log(`recordingId: ${recordingId}`)

  const d = await client.graphql({ 
    query: m.createRecording, variables: { ...b, recordingId }
  }) as GraphQLResult<{ createRecording: Recording }>

  if (!d.data?.createRecording) {
    console.error(`createRecording data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.createRecording)

}