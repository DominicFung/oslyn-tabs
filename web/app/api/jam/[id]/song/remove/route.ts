import { NextResponse } from 'next/server'
import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { removeSongFromJam } from '@/core/graphql/jam'

Amplify.configure(amplifyconfig, { ssr: true })

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: jamSessionId } = await context.params
  let songId = ''
  let index: number | undefined
  try {
    const body = await request.json()
    songId = typeof body?.songId === 'string' ? body.songId : ''
    if (typeof body?.index === 'number') index = body.index
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (!songId) return NextResponse.json({ error: 'songId is required' }, { status: 400 })
  try {
    const result = await generateClient().graphql({
      query: removeSongFromJam,
      variables: { jamSessionId, songId, userId, index },
    }) as GraphQLResult<{ removeSongFromJam: {
      jamSessionId: string
      songId: string
      title: string
      index: number
      currentSong: number
      queue: number[]
      songIds: string[]
    } | null }>
    if (!result.data?.removeSongFromJam) {
      return NextResponse.json({ error: 'Could not remove that song from the jam' }, { status: 403 })
    }
    return NextResponse.json(result.data.removeSongFromJam)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not remove that song from the jam' }, { status: 500 })
  }
}
