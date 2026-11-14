import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { createEmptySet, createPrivateJam } from '@/core/graphql/jam'
import { jamTitle } from '@/core/jamTitle'

Amplify.configure(amplifyconfig, { ssr: true })

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let timeZone: unknown
  try {
    const body = await request.json()
    timeZone = body?.timeZone
  } catch {
    timeZone = undefined
  }

  const description = jamTitle(timeZone)
  const client = generateClient()

  try {
    const created = await client.graphql({
      query: createEmptySet,
      variables: { userId, description, songs: [] },
    }) as GraphQLResult<{ createSet: { setListId: string } }>

    const setListId = created.data?.createSet?.setListId
    if (!setListId) {
      console.error(`createSet data is empty: ${JSON.stringify(created.data)}`)
      return NextResponse.json({ error: 'Could not create the set' }, { status: 500 })
    }

    const jam = await client.graphql({
      query: createPrivateJam,
      variables: { setListId, userId, policy: 'PRIVATE' },
    }) as GraphQLResult<{ createJamSession: { jamSessionId: string, policy?: string | null } }>

    const jamSessionId = jam.data?.createJamSession?.jamSessionId
    if (!jamSessionId) {
      console.error(`createJamSession data is empty: ${JSON.stringify(jam.data)}`)
      return NextResponse.json({ error: 'Could not start the jam', setListId }, { status: 500 })
    }

    return NextResponse.json({
      jamSessionId,
      setListId,
      description,
      policy: jam.data?.createJamSession?.policy || 'PRIVATE',
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Could not start the jam' }, { status: 500 })
  }
}
