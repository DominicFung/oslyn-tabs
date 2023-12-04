import { headers } from 'next/headers'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import * as q from '@/../src/graphql/queries'
import { Song, User } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import Unauth from "@/app/unauthorized"

import { _Session } from "@/core/utils/frontend"
import Songs from './songs'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function _Songs() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const name = session?.user?.name?.split(" ")[0]
  const userId = (session?.user as _Session)?.userId

  const req = { headers: { cookie: headers().get('cookie') } }
  const client = generateClient()
  let ownSongs = [] as Song[]

  try {
    const { data } = await client.graphql({ 
      query: q.listSongs, variables: { userId }
    }) as GraphQLResult<{ listSongs: Song[] }>
    if (data?.listSongs) ownSongs = data?.listSongs
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  let sharedSongs = [] as Song[]

  try {
    const { data } = await client.graphql({ 
      query: q.listSharedSongs, variables: { userId }
    }) as GraphQLResult<{ listSharedSongs: Song[] }>
    if (data?.listSharedSongs) sharedSongs = data?.listSharedSongs
    else throw new Error("data.listSharedSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  let user: User|null = null 

  try {
    const { data } = await client.graphql({ 
      query: q.getUserById, variables: { userId }
    }) as GraphQLResult<{ getUserById: User }>
    if (data?.getUserById) user = data.getUserById
    else throw new Error("data.getUserById is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <Songs user={user} ownSongs={ownSongs} sharedSongs={sharedSongs} />
  </>
}