import { NextResponse } from 'next/server'
import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { deleteJamSession } from '@/core/graphql/jam'

Amplify.configure(amplifyconfig, { ssr: true })

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id: jamSessionId } = await context.params
  try {
    const result = await generateClient().graphql({
      query: deleteJamSession,
      variables: { jamSessionId, userId },
    }) as GraphQLResult<{ deleteJamSession: { jamSessionId: string } | null }>
    if (!result.data?.deleteJamSession?.jamSessionId) {
      return NextResponse.json({ error: 'Only the host can delete this jam' }, { status: 403 })
    }
    return NextResponse.json(result.data.deleteJamSession)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Could not delete this jam' }, { status: 500 })
  }
}
