import { NextResponse } from 'next/server'
import { _Session } from '@/core/utils/frontend'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as m from '@/../src/graphql/mutations'
import { JamSongInput, SetList } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"

export interface SetRequest {
  description: string,
  songs: JamSongInput[]
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as SetRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(amplifyconfig)
  const client = generateClient()
  console.log(JSON.stringify(b))

  const d = await client.graphql({ 
    query: m.createSet, variables: { ...b, userId: userId }
  }) as GraphQLResult<{ createSet: SetList }>

  if (!d.data?.createSet) {
    console.error(`createSet data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.createSet)
}
