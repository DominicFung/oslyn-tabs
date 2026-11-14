import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { deleteSet } from '@/core/graphql/lists'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  Amplify.configure(amplifyconfig)
  const client = generateClient()

  try {
    const d = await client.graphql({
      query: deleteSet,
      variables: { setListId: id, userId },
    }) as GraphQLResult<{ deleteSet: { setListId: string, deleted: boolean, jamsRemoved: number } | null }>

    if (!d.data?.deleteSet?.deleted) {
      return NextResponse.json({ error: 'Could not delete this set' }, { status: 500 })
    }
    return NextResponse.json(d.data.deleteSet)
  } catch (e) {
    console.error(e)
    const message = e instanceof Error ? e.message : ''
    const status = message.toLowerCase().includes('unauthorized') ? 403 : 500
    return NextResponse.json({ error: status === 403 ? 'You can only delete sets you created' : 'Could not delete this set' }, { status })
  }
}
