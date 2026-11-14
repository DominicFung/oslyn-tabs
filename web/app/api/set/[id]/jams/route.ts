import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { countJamsForSet } from '@/core/graphql/lists'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  Amplify.configure(amplifyconfig)
  const client = generateClient()

  try {
    const d = await client.graphql({
      query: countJamsForSet,
      variables: { setListId: id, userId },
    }) as GraphQLResult<{ countJamsForSet: number }>

    if (typeof d.data?.countJamsForSet !== 'number') {
      return NextResponse.json({ error: 'Could not count jam rooms' }, { status: 500 })
    }
    return NextResponse.json({ count: d.data.countJamsForSet })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Could not count jam rooms' }, { status: 500 })
  }
}
