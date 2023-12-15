import { NextResponse } from 'next/server'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

import { SpotifyApi } from '@spotify/web-api-ts-sdk'
import secret from '@/secret.json'

export interface SpotifySearchRequest {
  title: string, artist: string
}

export async function POST(request: Request) {
  console.log(`${request.method} ${request.url}`)
  const b = await request.json() as SpotifySearchRequest

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return NextResponse.json({ error: 'Unauthorized'}, { status: 401 }) }
  const userId = (session?.user as _Session)?.userId
  console.log(userId)
  console.log(session?.user)

  const sdk = SpotifyApi.withClientCredentials(secret.spotify.clientId, secret.spotify.clientSecret, [])

  let track = await sdk.search(`${b.title} ${b.artist}`, ["track"], undefined, 1)
  console.log(track)

  console.log(`${request.method} ${request.url} .. complete`)
  return NextResponse.json(track)
}