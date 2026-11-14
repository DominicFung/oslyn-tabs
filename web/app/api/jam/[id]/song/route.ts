import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { addSongToLiveJam, JamSongChange } from '@/core/graphql/jam'

Amplify.configure(amplifyconfig, { ssr: true })

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: jamSessionId } = await context.params
  let songId = ''
  let key = ''
  let jumpTo = false
  try {
    const body = await request.json()
    songId = typeof body?.songId === 'string' ? body.songId : ''
    key = typeof body?.key === 'string' ? body.key : ''
    jumpTo = !!body?.jumpTo
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!songId || !key) return NextResponse.json({ error: 'songId and key are required' }, { status: 400 })

  Amplify.configure(amplifyconfig, { ssr: true })
  const client = generateClient()
  try {
    const result = await client.graphql({
      query: addSongToLiveJam,
      variables: { jamSessionId, songId, key, userId, jumpTo },
    }) as GraphQLResult<{ addSongToLiveJam: JamSongChange | null }>

    if (!result.data?.addSongToLiveJam) {
      return NextResponse.json({ error: 'Could not add that song to the jam' }, { status: 403 })
    }
    return NextResponse.json(result.data.addSongToLiveJam)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Could not add that song to the jam' }, { status: 500 })
  }
}
