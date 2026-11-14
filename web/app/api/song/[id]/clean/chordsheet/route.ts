import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import { Song } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'
import { cleanChordSheetCompletion } from '@/core/cleanChordSheet'

/**
 * Use ChatGPT to clean up chord sheet. A lot of chord sheets are not "formatted" corretly.
 *  1. 
 *  2. 
 */

export async function GET(request: Request) {
  console.log(`${request.method} ${request.url}`)

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(amplifyconfig)
  const client = generateClient()  
  
  const songId = request.url.split("song/")[1].split("/clean/chordsheet")[0]
  console.log(`songId: ${songId}`)

  const d = await client.graphql({
    query: q.getSong, variables: { songId, userId }
  }) as GraphQLResult<{ getSong: Song }>

  if (!d.data?.getSong) {
    console.error(`getSong data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  const song = d.data.getSong
  const csText = song.chordSheet || ""

  try {
    const chordsheet = await cleanChordSheetCompletion(csText)
    console.log(chordsheet)
    console.log(`${request.method} ${request.url} .. complete`)
    return NextResponse.json(chordsheet)
  } catch (e) {
    console.error("ChatGPT Error")
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }
}