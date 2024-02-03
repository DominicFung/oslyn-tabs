import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'
import { Band } from '@/../src/API'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(amplifyconfig)
  const client = generateClient()

  const d = await client.graphql({
    query: q.listBands, variables: { userId }
  }) as GraphQLResult<{ listBands: Band[] }>

  if (!d.data?.listBands === undefined || !d.data?.listBands === null) {
    console.error(`listBands data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  return NextResponse.json(d.data?.listBands)
}