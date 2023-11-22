import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as q from '@/../src/graphql/queries'
import { Song } from '@/../src/API'
import Edit from "./edit"

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import { Session } from "next-auth"
import Unauth from "@/app/unauthorized"

type _Session = Session & {
  userId: string
}

Amplify.configure({...awsConfig, ssr: true })

export default async function EditSong({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })
  let d = null as Song | null

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.getSong, { songId: params.id as string, userId }
    )) as GraphQLResult<{  getSong: Song }>
    
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