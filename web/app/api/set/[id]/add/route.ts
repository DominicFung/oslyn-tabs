import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { addSongToSet, getSetForAdd } from '@/core/graphql/jam'

export interface AddToSetRequest {
  key: string, songId: string
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const b = await request.json() as AddToSetRequest
  if (!b?.songId || !b?.key) return NextResponse.json({ error: 'songId and key are required' }, { status: 400 })

  const { id: setListId } = await context.params

  Amplify.configure(amplifyconfig, { ssr: true })
  const client = generateClient()

  try {
    const owned = await client.graphql({
      query: getSetForAdd,
      variables: { setListId, userId },
    }) as GraphQLResult<{ getSet: { setListId: string } | null }>

    if (!owned.data?.getSet?.setListId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const d = await client.graphql({
      query: addSongToSet,
      variables: { setListId, songId: b.songId, key: b.key },
    }) as GraphQLResult<{ addSongToSet: { setListId: string, description?: string | null } }>

    if (!d.data?.addSongToSet) {
      console.error(`addSongToSet data is empty: ${JSON.stringify(d.data)}`)
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }

    return NextResponse.json(d.data.addSongToSet)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
