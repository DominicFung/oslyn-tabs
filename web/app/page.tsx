
/**
 * Lavender (web):  #ede7f6
 * Oslyn Purple:    #651fff
 * Coral:           #ff8a65
 * Rasin Black:     #23232d
 * Eerie Black:     #212121
 */


import { headers } from 'next/headers'
import { Band, JamSession } from "@/../src/API"

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as q from '@/../src/graphql/queries'
import Main from './main'

Amplify.configure({...awsConfig, ssr: true })

export default async function Home() {
  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })

  let d = [] as JamSession[]

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.listPublicJamSessions, {}
    )) as GraphQLResult<{ listPublicJamSessions: JamSession[] }>
    if (data?.listPublicJamSessions) d = data?.listPublicJamSessions
    else throw new Error("data.listPublicJamSessions is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  let d2 = [] as Band[]

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.listPublicBands, {}
    )) as GraphQLResult<{ listPublicBands: Band[] }>
    if (data?.listPublicBands) d2 = data?.listPublicBands
    else throw new Error("data.listPublicBands is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <Main bands={d2} sessions={d} />
  </>
}