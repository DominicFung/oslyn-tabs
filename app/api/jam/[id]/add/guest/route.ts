import { NextRequest, NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import { GraphQLError } from 'graphql'
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'

import { _Session } from '@/core/utils/frontend'
import { JamSessionActiveUsers } from '@/src/API'

export interface AddGuestRequest {
  name: string,
  colour: string
}

export async function POST(request: NextRequest) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as AddGuestRequest

  const forwarded = request.headers.get("x-forwarded-for")
  console.log(forwarded)

  const ip = request.ip || (forwarded && forwarded.split(/, /)[0]) || request.headers.get("x-real-ip") || "unknown"
  console.log(`ip of "${b.name}": ${ip}`)
  console.log(request)

  Amplify.configure(awsConfig)
  console.log(b)

  const jamId = request.url.split("jam/")[1].split("/add/guest")[0]
  console.log(`jamId: ${jamId}`)

  try {
    const d = await API.graphql(graphqlOperation(
      m.enterJam, { jamSessionId: jamId, guestName: b.name, colour: b.colour, ip }
    )) as GraphQLResult<{ enterJam: JamSessionActiveUsers }>

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