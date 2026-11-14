import { GraphQLResult, generateClient } from 'aws-amplify/api'
import { jamAccess } from '@/core/graphql/jam'

export async function loadCanEditSongs(jamSessionId: string, userId?: string): Promise<boolean> {
  if (!userId) return false
  try {
    const client = generateClient()
    const { data } = await client.graphql({
      query: jamAccess,
      variables: { jamSessionId, userId },
    }) as GraphQLResult<{ getJamSession: { canEditSongs?: boolean | null } | null }>
    return !!data?.getJamSession?.canEditSongs
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    return false
  }
}
