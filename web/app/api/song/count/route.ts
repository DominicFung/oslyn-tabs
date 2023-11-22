import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as q from '@/../src/graphql/queries'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(awsConfig)

  const d = await API.graphql(graphqlOperation(
    q.getSongCount, { userId: userId, addSharedCount: true }
  )) as GraphQLResult<{ getSongCount: number }>

  if (!d.data?.getSongCount === undefined || !d.data?.getSongCount === null) {
    console.error(`getSongCount data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  return NextResponse.json({ count: d.data?.getSongCount })
}