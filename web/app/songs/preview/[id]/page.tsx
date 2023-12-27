import Image from "next/image"
import { headers } from 'next/headers'
import KeySelector from "./keySelector"

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import { Song } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import Unauth from "@/app/unauthorized"

import { _Session } from "@/core/utils/frontend"
import Views from "./views"

Amplify.configure(amplifyconfig, { ssr: true })

export default async function CreateJam(context: any) {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  if (!context.params.id) { throw `Jam Submission SongId: ${context.params.id} Not Provided.` }
  const songId = context.params.id
  console.log(`PAGE: /jam/start/song/${songId}`)

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

  return <>
      { d && <Views song={d} /> }
  </>
}