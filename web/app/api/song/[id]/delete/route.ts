import { NextResponse } from 'next/server'
import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { deleteSong } from '@/core/graphql/jam'
import type { SongDeletedEvent } from '@/app/songDeleted'

Amplify.configure(amplifyconfig, { ssr: true })

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: songId } = await context.params
  try {
    const result = await generateClient().graphql({
      query: deleteSong,
      variables: { songId, userId },
    }) as GraphQLResult<{ deleteSong: SongDeletedEvent | null }>
    if (!result.data?.deleteSong) return NextResponse.json({ error: 'Only the owner can delete this song' }, { status: 403 })
    return NextResponse.json(result.data.deleteSong)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not delete that song' }, { status: 500 })
  }
}
