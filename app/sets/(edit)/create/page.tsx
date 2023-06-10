
import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { Song } from '@/src/API'
import CreateSetTable from "./table"

const _generalUserId = "3d7fbd91-14fa-41da-935f-704ef74d7488"

Amplify.configure({...awsConfig, ssr: true })

export default async function CreateSet() {
  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })
  let d = [] as Song[]

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.listSongs, { userId: _generalUserId }
    )) as GraphQLResult<{ listSongs: Song[] }>

    if (data?.listSongs) d = data?.listSongs
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <CreateSetTable songs={d} />
  </>
}