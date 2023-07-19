import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'
import { Song } from '@/src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Session } from "next-auth"

export interface InviteRequest {
  songId: string,
  shareWithEmail: string,
  access: string
}

type _Session = Session & {
  userId: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as InviteRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(awsConfig)

  const d = await API.graphql(graphqlOperation(
    m.shareSong, { ...b, userId }
  )) as GraphQLResult<{ shareSong: Song }>

  if (!d.data?.shareSong) {
    console.error(`shareSong data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.shareSong)
}