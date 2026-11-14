import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getSongForSheet } from '@/core/graphql/lists'
import { Song } from '@/../src/API'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bandId = new URL(request.url).searchParams.get('band') || undefined

  Amplify.configure(amplifyconfig)
  const client = generateClient()

  try {
    const d = await client.graphql({
      query: getSongForSheet,
      variables: { songId: id, userId, ...(bandId ? { bandId } : {}) },
    }) as GraphQLResult<{ getSong: Song | null }>

    if (!d.data?.getSong) return NextResponse.json({ error: 'Song not found' }, { status: 404 })
    return NextResponse.json(d.data.getSong)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Could not load song' }, { status: 500 })
  }
}
