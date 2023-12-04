import { NextRequest, NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as m from '@/../src/graphql/mutations'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'
import { EnterJamMutation } from '@/../src/API'

export interface AddUserRequest {}

export async function POST(request: NextRequest) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as AddUserRequest

  const forwarded = request.headers.get("x-forwarded-for")
  console.log(forwarded)

  Amplify.configure(amplifyconfig)
  const client = generateClient()
  console.log(b)

  const jamId = request.url.split("jam/")[1].split("/add/user")[0]
  console.log(`jamId: ${jamId}`)

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  const ip = request.ip || (forwarded && forwarded.split(/, /)[0]) || request.headers.get("x-real-ip") || "unknown"
  console.log(`ip of "${userId}": ${ip}`)

  try {
    const d = await client.graphql({ 
      query: m.enterJam, variables: { jamSessionId: jamId, userId, ip }
    }) as GraphQLResult<EnterJamMutation>

    if (!d.data?.enterJam) {
      console.error(`enterJam data is empty: ${JSON.stringify(d.data)}`)
      return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
    }

    console.log(`${request.method} ${request.url} .. complete`)
    return NextResponse.json(d.data.enterJam)
  } catch (e: any) {
    if (e.errors[0].message) {
      console.error(e.errors[0].message)
      return NextResponse.json(e.errors[0].message)
    }
  }
  
  console.error("No idea what happened here.")
  return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
}