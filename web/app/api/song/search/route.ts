import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { searchSongs } from '@/core/graphql/jam'

Amplify.configure(amplifyconfig, { ssr: true })

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let query = ''
  try {
    const body = await request.json()
    query = typeof body?.query === 'string' ? body.query.trim() : ''
  } catch {
    query = ''
  }

  if (!query) return NextResponse.json({ songs: [] })
  if (query.length > 200) return NextResponse.json({ error: 'Query is too long' }, { status: 400 })

  const client = generateClient()
  try {
    const result = await client.graphql({
      query: searchSongs,
      variables: { userId, query },
    }) as GraphQLResult<{ searchSongs: {
      songId: string
      title: string
      artist?: string | null
      album?: string | null
      albumCover?: string | null
      chordSheetKey?: string | null
    }[] }>

    return NextResponse.json({ songs: result.data?.searchSongs || [] })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
