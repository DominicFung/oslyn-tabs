import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/../src/aws-exports'

import * as q from '@/../src/graphql/queries'
import { Band, Song, User } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
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

    console.log(d)
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
    return <Unauth />
  }

  let user: User|null = null 

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.getUserById, { userId }
    )) as GraphQLResult<{ getUserById: User }>
    if (data?.getUserById) user = data.getUserById
    else throw new Error("data.getUserById is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  let songs: Song[] = []

  if (user) {
    try {
      const { data } = await SSR.API.graphql(graphqlOperation(
        q.listSongs, { userId }
      )) as GraphQLResult<{ listSongs: Song[] }>
      if (data?.listSongs) songs = data?.listSongs
      else throw new Error("data.listSongs is empty.")
    } catch (e) {
      console.log(JSON.stringify(e, null, 2))
    }
  
    try {
      const { data } = await SSR.API.graphql(graphqlOperation(
        q.listSharedSongs, { userId }
      )) as GraphQLResult<{ listSharedSongs: Song[] }>
      if (data?.listSharedSongs) songs.push(...data?.listSharedSongs!)
      else throw new Error("data.listSharedSongs is empty.")
    } catch (e) {
      console.log(JSON.stringify(e, null, 2))
    }
  }
  

  return <>
    { d && <BandComponent band={d} user={user} songs={songs} /> }
  </>
}