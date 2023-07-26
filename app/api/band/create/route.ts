import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'
import { fromIni } from '@aws-sdk/credential-provider-ini'

import * as m from '@/src/graphql/mutations'
import { Band } from '@/src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Session } from "next-auth"

import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'

import cdk from "@/cdk-outputs.json"
import secret from "@/secret.json"
import config from '@/src/aws-exports'

export interface BandRequest {
  name: string,
  description: string
  imageUrl: string
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

  Amplify.configure(awsConfig)
  console.log(JSON.stringify(b))

  const d = await API.graphql(graphqlOperation(
    m.createBand, { ...b, userId }
  )) as GraphQLResult<{ createBand: Band }>

  if (!d.data?.createBand) {
    console.error(`createBand data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  const band = d.data.createBand as Band

  if (b.imageUrl.indexOf("replicate.delivery") > -1) {
    let img = await (await fetch(b.imageUrl, {
      headers: {'Authorization': `TOKEN ${secret.replicate.token}`}
    })).arrayBuffer()
    console.log(img)

    let s3Config = { region: "us-east-1" } as S3ClientConfig
    if (process.env.NODE_ENV === 'development') { 
      s3Config["credentials"] = { 
        accessKeyId: cdk["oslynstudio-IamStack"].AccessKey, 
        secretAccessKey: cdk["oslynstudio-IamStack"].SecretKey 
      }
      s3Config.region = 'us-east-1'
    }

    let s3 = new S3Client(s3Config)

    const res1 = await s3.send(
      new PutObjectCommand({
        Bucket: cdk["oslynstudio-S3Stack"].bucketName,
        Key: `band/${band.bandId}/latest.jpg`,
        Body: img as Buffer
      })
    )

    console.log(res1)
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.createBand)
}