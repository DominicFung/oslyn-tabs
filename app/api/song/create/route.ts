import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'
import { Song } from '@/src/API'

// TODO Remove
const _generalUserId = "3d7fbd91-14fa-41da-935f-704ef74d7488"

export interface SongRequest {
  title: string,
  artist?: string,
  album?: string,
  key: string,
  rawTabs: string,
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as SongRequest
  // const cookies = req.cookies?.token
  // console.log(cookies)

  // TODO Authenticate User
  //console.log(b)
  Amplify.configure(awsConfig)

  const d = await API.graphql(graphqlOperation(
    m.createSong, { ...b, userId: _generalUserId }
  )) as GraphQLResult<{ createSong: Song }>

  if (!d.data?.createSong) {
    console.error(`createSong data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.createSong)
}