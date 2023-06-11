import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'
import { JamSession } from '@/src/API'

// TODO Remove
const _generalUserId = "3d7fbd91-14fa-41da-935f-704ef74d7488"

export interface JamRequest {
  setListId: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as JamRequest
  // const cookies = req.cookies?.token
  // console.log(cookies)

  // TODO Authenticate User
  //console.log(b)
  Amplify.configure(awsConfig)

  const d = await API.graphql(graphqlOperation(
    m.createJamSession, { ...b, userId:  _generalUserId }
  )) as GraphQLResult<{ createJamSession: JamSession }>

  if (!d.data?.createJamSession) {
    console.error(`createJamSession data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.createJamSession)
}