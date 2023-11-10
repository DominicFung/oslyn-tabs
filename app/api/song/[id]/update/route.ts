import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'
import { chordSheetPlatform, Song } from '@/src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

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

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(awsConfig)
  console.log(b)

  const songId = request.url.split("song/")[1].split("/update")[0]
  console.log(`songId: ${songId}`)

  const d = await API.graphql(graphqlOperation(
    m.updateSong, { ...b, userId, songId }
  )) as GraphQLResult<{ updateSong: Song }>

  if (!d.data?.updateSong) {
    console.error(`updateSong data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.updateSong)
}