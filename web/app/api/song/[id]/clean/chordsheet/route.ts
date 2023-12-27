import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import { chordSheetPlatform, Song } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

import OpenAI from 'openai'
import secret from '@/secret.json'

/**
 * Use ChatGPT to clean up chord sheet. A lot of chord sheets are not "formatted" corretly.
 *  1. 
 *  2. 
 */

export async function GET(request: Request) {
  console.log(`${request.method} ${request.url}`)

  const openai = new OpenAI({
    organization: secret.openai.organization,
    apiKey: secret.openai.apiKey,
  })

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

  const chordsheet = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { 
        role: "system", 
        content: `User will be providing text that represent lyrics and chords of a song. 
        The text also contain section headers (ie. Intro, Verse 1, Chorus, etc.). 
        Make sure that all section headers start and end with square brackets.
        Remove all comments in the text, (these may be in the form of commentary or description of musical dynamics.)` 
      },
      { role: "user",   content: csText }
    ]
  })

  console.log(chordsheet)

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(chordsheet)
}