import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'
import { chordSheetPlatform, Song } from '@/src/API'

// TODO Remove
const _generalUserId = "3d7fbd91-14fa-41da-935f-704ef74d7488"

export interface SongUpdateRequest {
  songId: string,
  title?: string,
  artist?: string,
  album?: string,
  albumCover?: string,
  beat?: { count: number, note: number }

  chordSheet?: string,
  chordSheetKey?: string,
  originalPlatorm?: chordSheetPlatform,
  originalLink?: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as SongUpdateRequest

  Amplify.configure(awsConfig)
  const d = await API.graphql(graphqlOperation(
    m.updateSong, { ...b, userId: _generalUserId }
  )) as GraphQLResult<{ updateSong: Song }>

  if (!d.data?.updateSong) {
    console.error(`updateSong data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.updateSong)
}