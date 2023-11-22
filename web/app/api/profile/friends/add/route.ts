import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as m from '@/../src/graphql/mutations'
import { User } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

export interface AddFriendRequest {
  email: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as AddFriendRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(awsConfig)

  const d = await API.graphql(graphqlOperation(
    m.addFriendByEmail, { ...b, userId }
  )) as GraphQLResult<{ addFriendByEmail: User }>

  if (!d.data?.addFriendByEmail) {
    console.error(`addFriendByEmail data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.addFriendByEmail)
}