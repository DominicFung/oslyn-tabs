import { headers } from 'next/headers'
import { Band } from "@/../src/API"

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'
import * as q from '@/../src/graphql/queries'

import BandInfo from "../../../(components)/bandInfo"
import Save from "../../../(components)/save"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import Unauth from "@/app/unauthorized"

import { _Session } from '@/core/utils/frontend'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function CreateBand(context: any) {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  console.log(context)

  const req = { headers: { cookie: headers().get('cookie') } }
  const client = generateClient()
  let d = null as Band | null

  try {
    const { data } = await client.graphql({ 
      query: q.getBand, variables: { 
        bandId: context.params.id as string, userId
      }
    }) as GraphQLResult<{  getBand: Band }>
    
    console.log(data)
    if (data?.getBand) d = data.getBand
    else throw new Error("No song found")

  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    return <Unauth />
  }

  return <>
    <div className="m-5 h-[90vh]">
      <BandInfo band={d} />
      <Save band={d} type="create" />
    </div>
  </>
}