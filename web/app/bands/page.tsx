import { headers } from 'next/headers'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/core/auth"
import Unauth from "@/app/unauthorized"
import amplifyconfig from '@/../src/amplifyconfiguration.json'
import * as q from '@/../src/graphql/queries'

import { _Session } from "@/core/utils/frontend"
import { Band, Song, User } from '@/../src/API'
import Bands from './bands'
import { BandContextProvider } from './context'
import BandTabs from './(components)/bandTabs'
import NewFeature from '../(components)/new'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function Band() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const name = session?.user?.name?.split(" ")[0]
  const userId = (session?.user as _Session)?.userId

  const req = { headers: { cookie: headers().get('cookie') } }
  const client = generateClient()
  let d = [] as Band[]

  try {
    const { data } = await client.graphql({ 
      query: q.listBands, variables: { userId }
    }) as GraphQLResult<{ listBands: Band[] }>
    if (data?.listBands) d = data?.listBands
    else throw new Error("data.listBands is empty.")
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

  let songs: Song[] = []

  try {
    const { data } = await client.graphql({ 
      query: q.listSongs, variables: { userId }
    }) as GraphQLResult<{ listSongs: Song[] }>
    if (data?.listSongs) songs = data?.listSongs
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  try {
    const { data } = await client.graphql({ 
      query: q.listSharedSongs, variables: { userId }
    }) as GraphQLResult<{ listSharedSongs: Song[] }>
    if (data?.listSharedSongs) songs.push(...data?.listSharedSongs!)
    else throw new Error("data.listSharedSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <BandContextProvider>
      <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
        <div className="lg:pt-16 lg:pb-4 pt-8 pb-2 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
            <NewFeature />
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">{name ? `${name}'s` : "Your"} Bands</h1>
            <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-200">
              Organize your friends into bands!
            </p>
        </div>
        
        <div className="flex flex-row z-10 relative">
          <BandTabs bands={d} />
          <div className="flex-1" />
          <a href="/bands/create">
            <button type="submit" className="text-white mx-5 my-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">+</button>
          </a>
        </div>
      </section>
      { user && <Bands bands={d} user={user} songs={songs} /> }
    </BandContextProvider>
  </>
}