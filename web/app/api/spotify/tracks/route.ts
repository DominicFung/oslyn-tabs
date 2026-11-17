import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { searchSpotifyTracks } from '@/core/graphql/jam'

Amplify.configure(amplifyconfig, { ssr: true })

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let term = ''
  let limit = 5
  try {
    const body = await request.json()
    term = typeof body?.term === 'string' ? body.term.trim() : ''
    if (typeof body?.limit === 'number') limit = body.limit
  } catch {
    return NextResponse.json({ tracks: [], error: 'bad_request' }, { status: 400 })
  }
  if (!term) return NextResponse.json({ tracks: [], error: null })

  const client = generateClient()
  try {
    const result = await client.graphql({
      query: searchSpotifyTracks,
      variables: { userId, term, limit },
    }) as GraphQLResult<{ searchSpotifyTracks: { tracks: { spotifyId: string, title: string, artist?: string | null, album?: string | null, albumCover?: string | null }[], error?: string | null } }>
    const payload = result.data?.searchSpotifyTracks
    return NextResponse.json({
      tracks: payload?.tracks || [],
      error: payload?.error || null,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ tracks: [], error: 'spotify_unavailable' })
  }
}
