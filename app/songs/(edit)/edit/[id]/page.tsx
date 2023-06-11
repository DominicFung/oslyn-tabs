import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { Song } from '@/src/API'
import Edit from "./edit"

Amplify.configure({...awsConfig, ssr: true })

export default async function EditSong({ params }: { params: { id: string } }) {
  // https://docs.amplify.aws/lib/ssr/q/platform/js/#2-prepare-a-request-object-for-withssrcontext-to-perform-server-side-operations-that-require-authentication

  const req = {
    headers: {
      cookie: headers().get('cookie'),
    },
  }
  const SSR = withSSRContext({ req })
  let d = null as Song | null

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.getSong, { songId: params.id as string }
    )) as GraphQLResult<{  getSong: Song }>
    
    console.log(data)
    if (data?.getSong) d = data.getSong
    else throw new Error("No song found")

  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }
  
  return <div>
    {d && <Edit song={d} />}
  </div>
}