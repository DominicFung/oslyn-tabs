import { Suspense } from 'react'
import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getUserForLists, listSharedSongs, listSongs } from '@/core/graphql/lists'
import { Song, User } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import Unauth from "@/app/unauthorized"
import { _Session } from "@/core/utils/frontend"
import NewFeature from "../(components)/new"
import ListShell from "../(components)/listShell"
import ListFallback from "../(components)/listFallback"
import { renderAsync } from "@/core/renderAsync"
import Songs from './songs'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function SongsPage() {
  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const name = session?.user?.name?.split(" ")[0]
  const userId = (session?.user as _Session)?.userId

  return (
    <ListShell>
      <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
        <div className="lg:pt-16 lg:pb-4 pt-8 pb-2 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
          <NewFeature />
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">{name ? `${name}'s` : "Your"} Songs</h1>
          <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-200">
            These are all the song&apos;s you&apos;ve added. Share them with your friends!
          </p>
        </div>
        <div className="flex flex-row-reverse z-10 relative">
          <a href="/songs/create">
            <button type="submit" className="text-white mx-5 my-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">Add Song</button>
          </a>
        </div>
      </section>
      <Suspense fallback={<ListFallback label="Loading songs…" />}>
        {renderAsync(SongsLoader, { userId })}
      </Suspense>
    </ListShell>
  )
}

async function SongsLoader({ userId }: { userId: string }) {
  const client = generateClient()
  let ownSongs = [] as Song[]
  let sharedSongs = [] as Song[]
  let user: User | null = null

  try {
    const { data } = await client.graphql({
      query: listSongs, variables: { userId }
    }) as GraphQLResult<{ listSongs: Song[] }>
    if (data?.listSongs) ownSongs = data.listSongs
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  try {
    const { data } = await client.graphql({
      query: listSharedSongs, variables: { userId, optimize: true }
    }) as GraphQLResult<{ listSharedSongs: Song[] }>
    if (data?.listSharedSongs) sharedSongs = data.listSharedSongs
    else throw new Error("data.listSharedSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  try {
    const { data } = await client.graphql({
      query: getUserForLists, variables: { userId }
    }) as GraphQLResult<{ getUserById: User }>
    if (data?.getUserById) user = data.getUserById
    else throw new Error("data.getUserById is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <Songs user={user} ownSongs={ownSongs} sharedSongs={sharedSongs} />
}
