import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { Band } from '@/src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { _Session } from '@/core/utils/frontend'
import Unauth from "@/app/unauthorized"

import BandComponent from './band'

Amplify.configure({...awsConfig, ssr: true })

export default async function BandPage({ params }: { params: { id: string } }) {
  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })

  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId

  let d = null as Band | null
  let p = { bandId: params.id as string } as any
  if (userId) p.userId = userId

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.getBand, p
    )) as GraphQLResult<{ getBand: Band }>

    if (data?.getBand) d = data.getBand
    else return <Unauth />
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    return <Unauth />
  }

  return <>
    { d && <BandComponent band={d} /> }
  </>
}