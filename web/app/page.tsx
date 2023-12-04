
/**
 * Lavender (web):  #ede7f6
 * Oslyn Purple:    #651fff
 * Coral:           #ff8a65
 * Rasin Black:     #23232d
 * Eerie Black:     #212121
 */


import { headers } from 'next/headers'
import { Band, JamSession, ListPublicBandsQuery, ListPublicJamSessionsQuery } from "@/../src/API"

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import Main from './main'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function Home() {
  const req = { headers: { cookie: headers().get('cookie') } }
  const client = generateClient()

  let d = [] as JamSession[]

  try {
    const { data } = await client.graphql({ 
      query: q.listPublicJamSessions
  }) as GraphQLResult<ListPublicJamSessionsQuery>
    if (data?.listPublicJamSessions) d = data?.listPublicJamSessions as JamSession[]
    else throw new Error("data.listPublicJamSessions is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  let d2 = [] as Band[]

  try {
    const { data } = await client.graphql({ 
      query: q.listPublicBands
    }) as GraphQLResult<ListPublicBandsQuery>
    if (data?.listPublicBands) d2 = data?.listPublicBands as Band[]
    else throw new Error("data.listPublicBands is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <Main bands={d2} sessions={d} />
  </>
}