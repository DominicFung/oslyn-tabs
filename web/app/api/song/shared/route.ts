import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as q from '@/../src/graphql/queries'
import { Song } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Session } from "next-auth"

type _Session = Session & {
  userId: string
}

export async function GET(request: Request) {
  console.log(`${request.method} ${request.url}`)

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(awsConfig)

  const d = await API.graphql(graphqlOperation(
    q.listSharedSongs, { userId, optimize: true }
  )) as GraphQLResult<{ listSharedSongs: Song[] }>

  if (!d.data?.listSharedSongs) {
    console.error(`listSharedSongs data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.listSharedSongs)
}