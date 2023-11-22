import { _Session } from '@/core/utils/frontend'
import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as m from '@/../src/graphql/mutations'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Band } from '@/../src/API'

export interface ShareBandRequest {
  bandId: string, songId: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as ShareBandRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(awsConfig)
  console.log(JSON.stringify(b))

  const d = await API.graphql(graphqlOperation(
    m.shareSongWithBand, { ...b, userId: userId }
  )) as GraphQLResult<{ shareSongWithBand: Band }>

  if (!d.data?.shareSongWithBand) {
    console.error(`shareSongWithBand data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.shareSongWithBand)
}