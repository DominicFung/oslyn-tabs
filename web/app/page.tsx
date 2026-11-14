import { Suspense } from 'react'
import { Band, JamSession } from "@/../src/API"

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'
import { getServerSession } from "next-auth/next"

import { listPublicBands, listPublicJamSessions, listUserJamSessions } from '@/core/graphql/lists'
import { authOptions } from "@/core/auth"
import { _Session } from "@/core/utils/frontend"
import NewFeature from "./(components)/new"
import ListShell from "./(components)/listShell"
import ListFallback from "./(components)/listFallback"
import { renderAsync } from "@/core/renderAsync"
import { BandGrid, JamLists } from './main'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function Home() {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId

  return (
    <ListShell>
      <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
        <div className="pt-8 px-4 pb-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:pb-4 z-10 relative">
          <NewFeature />
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Jam Now!</h1>
          <Suspense fallback={<ListFallback label="Loading jam rooms…" />}>
            {renderAsync(HomeJams, { userId })}
          </Suspense>
        </div>
      </section>
      <Suspense fallback={<ListFallback label="Loading bands…" />}>
        {renderAsync(HomeBands, {})}
      </Suspense>
    </ListShell>
  )
}

async function HomeJams({ userId }: { userId?: string }) {
  const client = generateClient()
  let sessions = [] as JamSession[]
  let mySessions: JamSession[] | null = null

  try {
    const { data } = await client.graphql({
      query: listPublicJamSessions
    }) as GraphQLResult<{ listPublicJamSessions: JamSession[] }>
    if (data?.listPublicJamSessions) sessions = data.listPublicJamSessions
    else throw new Error("data.listPublicJamSessions is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  if (userId) {
    mySessions = []
    try {
      const { data } = await client.graphql({
        query: listUserJamSessions,
        variables: { userId },
      }) as GraphQLResult<{ listUserJamSessions: JamSession[] }>
      if (data?.listUserJamSessions) mySessions = data.listUserJamSessions
      else throw new Error("data.listUserJamSessions is empty.")
    } catch (e) {
      console.log(JSON.stringify(e, null, 2))
    }
  }

  return <JamLists sessions={sessions} mySessions={mySessions} />
}

async function HomeBands() {
  const client = generateClient()
  let bands = [] as Band[]

  try {
    const { data } = await client.graphql({
      query: listPublicBands
    }) as GraphQLResult<{ listPublicBands: Band[] }>
    if (data?.listPublicBands) bands = data.listPublicBands
    else throw new Error("data.listPublicBands is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <BandGrid bands={bands} />
}
