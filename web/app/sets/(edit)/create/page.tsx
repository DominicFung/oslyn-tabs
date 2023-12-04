
import { headers } from 'next/headers'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import { Song } from '@/../src/API'
import CreateSetTable from "./table"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Session } from "next-auth"
import Unauth from "@/app/unauthorized"

Amplify.configure(amplifyconfig, { ssr: true })

type _Session = Session & {
  userId: string
}

export default async function CreateSet() {
  const req = { headers: { cookie: headers().get('cookie') } }
  const client = generateClient()
  let d = [] as Song[]

  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  try {
    const { data } = await client.graphql({ 
      query: q.listSongs, variables: { userId }
    }) as GraphQLResult<{ listSongs: Song[] }>

    if (data?.listSongs) d = data?.listSongs
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  try {
    const { data } = await client.graphql({ 
      query: q.listSharedSongs, variables: { userId }
    }) as GraphQLResult<{ listSharedSongs: Song[] }>

    if (data?.listSharedSongs) d.push(...data?.listSharedSongs)
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <CreateSetTable songs={d} />
  </>
}