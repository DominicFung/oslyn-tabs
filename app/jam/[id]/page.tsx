import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { JamSession, User } from '@/src/API'

import Player from '@/app/(player)/player'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { _Session } from '@/core/utils/frontend'
import Unauth from "@/app/unauthorized"

Amplify.configure({...awsConfig, ssr: true })

export default async function JamPlayer({ params }: { params: { id: string } }) {
  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })

  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId

  let d = null as JamSession | null
  let p = { jamSessionId: params.id as string } as any
  if (userId) p.userId = userId

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.getJamSession, p
    )) as GraphQLResult<{ getJamSession: JamSession }>
    
    if (data?.getJamSession) d = data.getJamSession
    else return <Unauth />
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    return <Unauth />
  }

  let user: User|null = null
  if (userId) {
    try {
      const { data } = await SSR.API.graphql(graphqlOperation(
        q.getUserById, { userId }
      )) as GraphQLResult<{ getUserById: User }>
      if (data?.getUserById) user = data.getUserById
      else throw new Error("data.getUserById is empty.")
    } catch (e) {
      console.log(JSON.stringify(e, null, 2))
    }
  }

  

  // a private jam session cannot have guests
  if (d.policy === "PRIVATE" && !user) return <Unauth />

  return <>
    {d && <Player jam={d} user={user}/>}
  </>
}