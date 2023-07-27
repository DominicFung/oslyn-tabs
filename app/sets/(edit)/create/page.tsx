
import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { Song } from '@/src/API'
import CreateSetTable from "./table"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { Session } from "next-auth"
import Unauth from "@/app/unauthorized"

Amplify.configure({...awsConfig, ssr: true })

type _Session = Session & {
  userId: string
}

export default async function CreateSet() {
  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })
  let d = [] as Song[]

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.listSongs, { userId }
    )) as GraphQLResult<{ listSongs: Song[] }>

    if (data?.listSongs) d = data?.listSongs
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.listSharedSongs, { userId }
    )) as GraphQLResult<{ listSharedSongs: Song[] }>

    if (data?.listSharedSongs) d.push(...data?.listSharedSongs)
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <CreateSetTable songs={d} />
  </>
}