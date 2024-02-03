import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as m from '@/../src/graphql/mutations'
import { Band, CreateBandMutation, UpdateBandMutation } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Session } from "next-auth"
import { _Session } from '@/core/utils/frontend'

import cdk from "@/cdk-outputs.json"
import secret from "@/secret.json"

export interface BandImageRequest {
  image: string
}

export async function POST(request: Request){
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as BandImageRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  if (!b.image) {
    console.error(`both b.image cannot be empty`)
    return NextResponse.json({ error: `Improper Body` }, { status: 400 })
  }

  const bandId = request.url.split("band/")[1].split("/image")[0]
  console.log(`songId: ${bandId}`)

  Amplify.configure(amplifyconfig)
  const client = generateClient()

  const d = await client.graphql({ 
    query: m.updateBand, variables: { bandId: bandId, imageUrl: `https://${cdk['oslynstudio-S3Stack']["bucketName"]}.s3.amazonaws.com/${b.image}` }
  }) as GraphQLResult<UpdateBandMutation>

  if (!d.data?.updateBand) {
    console.error(`updateBand data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.updateBand)
}