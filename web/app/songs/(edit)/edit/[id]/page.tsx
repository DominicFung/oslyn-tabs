import { headers } from 'next/headers'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import { Song } from '@/../src/API'
import Edit from "./edit"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import Unauth from "@/app/unauthorized"

import { _Session } from '@/core/utils/frontend'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function EditSong(context: any) {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  console.log(context)

  const bandId = context.searchParams.band || ""

  const req = { headers: { cookie: headers().get('cookie') } }
  const client = generateClient()
  let d = null as Song | null

  try {
    const { data } = await client.graphql({ 
      query: q.getSong, variables: { 
        songId: context.params.id as string, userId,
        bandId: bandId
      }
    }) as GraphQLResult<{  getSong: Song }>
    
    console.log(data)
    if (data?.getSong) d = data.getSong
    else throw new Error("No song found")

  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    return <Unauth />
  }
  
  return <div>
    {d && <Edit song={d} />}
  </div>
}