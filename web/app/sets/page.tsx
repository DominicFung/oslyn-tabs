import { Suspense } from 'react'
import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from "aws-amplify/api"
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { listSets } from '@/core/graphql/lists'
import { SetList } from '@/../src/API'

import { getServerSession } from "next-auth/next"
import { authOptions } from "@/core/auth"
import Unauth from "@/app/unauthorized"
import { _Session } from "@/core/utils/frontend"
import NewFeature from "../(components)/new"
import ListShell from "../(components)/listShell"
import ListFallback from "../(components)/listFallback"
import { renderAsync } from "@/core/renderAsync"
import Sets from './sets'

Amplify.configure(amplifyconfig, { ssr: true })

export default async function SetsPage() {
  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const name = session?.user?.name?.split(" ")[0]
  const userId = (session?.user as _Session)?.userId

  return (
    <ListShell>
      <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
        <div className="lg:pt-16 lg:pb-4 pt-8 pb-2 px-4 mx-auto max-w-screen-xl text-center z-10 relative">
          <NewFeature />
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">{name ? `${name}'s` : "Your"} Sets</h1>
          <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-200">
            These are all the set lists you&apos;ve created. Share them with your friends!
          </p>
        </div>
        <div className="flex flex-row-reverse z-10 relative">
          <a href="/sets/create">
            <button type="submit" className="text-white mx-5 my-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">Create Set</button>
          </a>
        </div>
      </section>
      <Suspense fallback={<ListFallback label="Loading sets…" />}>
        {renderAsync(SetsLoader, { userId })}
      </Suspense>
    </ListShell>
  )
}

async function SetsLoader({ userId }: { userId: string }) {
  const client = generateClient()
  let sets = [] as SetList[]

  try {
    const { data } = await client.graphql({
      query: listSets, variables: { userId }
    }) as GraphQLResult<{ listSets: SetList[] }>
    if (data?.listSets) sets = data.listSets
    else throw new Error("data.listSets is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <Sets sets={sets} />
}
