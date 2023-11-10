import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { User } from '@/src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { _Session } from '@/core/utils/frontend'
import Unauth from "@/app/unauthorized"
import Profile from './profile'

Amplify.configure({...awsConfig, ssr: true })

export default async function _Profile () {
  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  let d = null as User | null

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.getUserById, { userId }
    )) as GraphQLResult<{ getUserById: User }>

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