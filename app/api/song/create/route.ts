import { NextResponse } from 'next/server'

import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as m from '@/src/graphql/mutations'
import { Song } from '@/src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

import { S3Client, PutObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3'

import cdk from "@/cdk-outputs.json"
import { uint8ArrayToArrayBuffer } from '@/core/utils/backend'

export interface SongRequest {
  title: string,
  artist?: string,
  album?: string,
  albumCover?: string,
  arrayBuffer?: Uint8Array,
  chordSheet: string,
  chordSheetKey: string,
  shareWithBand?: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as SongRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId

  if (!b.albumCover && !b.arrayBuffer) {
    console.error(`both b.albumCover && b.arrayBuffer cannot be empty`)
    return NextResponse.json({ error: `Improper Body` }, { status: 400 })
  }

  Amplify.configure(awsConfig)

  const d = await API.graphql(graphqlOperation(
    m.createSong, { ...b, userId }
  )) as GraphQLResult<{ createSong: Song }>

  if (!d.data?.createSong) {
    console.error(`createSong data is empty: ${JSON.stringify(d.data)}`)
    return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
  }

  const song = d.data.createSong as Song 
  const needStorage = b.arrayBuffer != undefined

  if (needStorage) {
    let s3Config = { region: "us-east-1" } as S3ClientConfig
    if (process.env.NODE_ENV === 'development') { 
      s3Config["credentials"] = { 
        accessKeyId: cdk["oslynstudio-IamStack"].AccessKey, 
        secretAccessKey: cdk["oslynstudio-IamStack"].SecretKey 
      }
      s3Config.region = 'us-east-1'
    }

    let s3 = new S3Client(s3Config)
    let img = uint8ArrayToArrayBuffer(b.arrayBuffer as any)

    const res1 = await s3.send(
      new PutObjectCommand({
        Bucket: cdk["oslynstudio-S3Stack"].bucketName,
        Key: `song/${song.songId}/cover.jpg`,
        Body: img as Buffer
      })
    )
    
    console.log(res1)

    console.log(song.songId)
    const d = await API.graphql(graphqlOperation(
      m.updateSong, { userId, songId: song.songId, albumCover: `https://${cdk['oslynstudio-S3Stack']["bucketName"]}.s3.amazonaws.com/song/${song.songId}/cover.jpg` }
    )) as GraphQLResult<{ updateSong: Song }>

    if (!d.data?.updateSong) {
      console.error(`updateSong data is empty: ${JSON.stringify(d.data)}`)
      return NextResponse.json({ error: 'Internal Server Error'}, { status: 500 })
    }
  }

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(d.data.createSong)
}