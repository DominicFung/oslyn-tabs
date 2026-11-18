import { NextResponse } from 'next/server'
import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { getSongUsage } from '@/core/graphql/jam'

Amplify.configure(amplifyconfig, { ssr: true })

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: songId } = await context.params
  try {
    const result = await generateClient().graphql({
      query: getSongUsage,
      variables: { songId, userId },
    }) as GraphQLResult<{ getSongUsage: { songId: string, setCount: number, jamCount: number } | null }>
    if (!result.data?.getSongUsage) return NextResponse.json({ error: 'Only the owner can delete this song' }, { status: 403 })
    return NextResponse.json(result.data.getSongUsage)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not check where this song is used' }, { status: 500 })
  }
}
