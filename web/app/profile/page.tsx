import { headers } from 'next/headers'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import { User } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'
import Unauth from "@/app/unauthorized"
import Profile from './profile'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function _Profile () {
  const req = { headers: { cookie: headers().get('cookie') } }
  const client = generateClient()

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  let d = null as User | null

  try {
    const { data } = await client.graphql({ 
      query: q.getUserById, variables: { userId }
    }) as GraphQLResult<{ getUserById: User }>

    if (data?.getUserById) d = data?.getUserById
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  if (d) return <>
    <Profile user={d} />
  </>
  else return <Unauth />
}