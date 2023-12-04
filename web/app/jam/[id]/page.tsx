import { headers } from 'next/headers'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import { JamSession, User } from '@/../src/API'

import Player from '@/app/(player)/player'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'
import Unauth from "@/app/unauthorized"

Amplify.configure(amplifyconfig, { ssr: true })

export default async function JamPlayer({ params }: { params: { id: string } }) {
  const req = { headers: { cookie: headers().get('cookie') } }
  const client = generateClient()

  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId

  let d = null as JamSession | null
  let p = { jamSessionId: params.id as string } as any
  if (userId) p.userId = userId

  try {
    const { data } = await client.graphql({ 
      query: q.getJamSession, variables: p
    }) as GraphQLResult<{ getJamSession: JamSession }>
    
    if (data?.getJamSession) d = data.getJamSession
    else return <Unauth />
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    return <Unauth />
  }

  let user: User|null = null
  if (userId) {
    try {
      const { data } = await client.graphql({ 
        query: q.getUserById, variables: { userId }
      }) as GraphQLResult<{ getUserById: User }>
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