import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { JamSession } from '@/src/API'

import Player from '@/app/(player)/player'

const _generalUserId = "3d7fbd91-14fa-41da-935f-704ef74d7488"

Amplify.configure({...awsConfig, ssr: true })

export default async function JamPlayer({ params }: { params: { id: string } }) {
  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })
  let d = null as JamSession | null

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.getJamSession, { jamSessionId: params.id as string, userId: _generalUserId }
    )) as GraphQLResult<{  getJamSession: JamSession }>
    
    //console.log(JSON.stringify(data, null, 2))
    if (data?.getJamSession) d = data.getJamSession
    else throw new Error("No Jam Session found")

  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    {d && <Player jam={d} />}
  </>
}