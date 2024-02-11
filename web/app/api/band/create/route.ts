import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as m from '@/../src/graphql/mutations'
import { Band, CreateBandMutation, UpdateBandMutation } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Session } from "next-auth"

import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'

import cdk from "@/cdk-outputs.json"
import secret from "@/secret.json"

export interface BandRequest {
  name: string,
  description: string
  imageUrl?: string
  policy: string
}

type _Session = Session & {
  userId: string
}

export async function POST(request: Request){
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as BandRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  Amplify.configure(amplifyconfig)
  const client = generateClient()
  //console.log(JSON.stringify(b))

  const d = await client.graphql({ 
    query: m.createBand, variables: { ...b, userId }
  }) as GraphQLResult<CreateBandMutation>

  if (!d.data?.createBand) {
    console.error(`createBand data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  const band = d.data.createBand as Band // END of Spotify API uploads!
  if (b.imageUrl!.indexOf("replicate.delivery") === -1 && b.imageUrl != 'bucket') {
    console.log(`${request.method} ${request.url} .. complete`)
    return NextResponse.json(d.data.createBand)
  }

  // This image was AI generated, we need to save to S3
  if (b.imageUrl!.indexOf("replicate.delivery") > -1) {
    let s3Config = { region: "us-east-1" } as S3ClientConfig
    if (process.env.NODE_ENV === 'development') { 
      s3Config["credentials"] = { 
        accessKeyId: cdk["oslynstudio-IamStack"].AccessKey, 
        secretAccessKey: cdk["oslynstudio-IamStack"].SecretKey 
      }
      s3Config.region = 'us-east-1'
    }

    let s3 = new S3Client(s3Config)
    let img = await (await fetch(b.imageUrl!, {
      headers: {'Authorization': `TOKEN ${secret.replicate.token}`}
    })).arrayBuffer()

    const res1 = await s3.send(
      new PutObjectCommand({
        Bucket: cdk["oslynstudio-S3Stack"].bucketName,
        Key: `band/${band.bandId}/latest.jpg`,
        Body: img as Buffer
      })
    )

    console.log(res1)
  }

  console.log("")
  console.log(band.bandId)
  const d2 = await client.graphql({ 
    query: m.updateBand, variables: { bandId: band.bandId, imageUrl: `https://${cdk['oslynstudio-S3Stack']["bucketName"]}.s3.amazonaws.com/band/${band.bandId}/latest.jpg` }
  }) as GraphQLResult<UpdateBandMutation>

  if (!d2.data?.updateBand) {
    console.error(`createBand data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.createBand)
}