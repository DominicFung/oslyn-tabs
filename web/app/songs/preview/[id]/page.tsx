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
import { SongPreviewContextProvider } from "./context"

Amplify.configure(amplifyconfig, { ssr: true })

export default async function CreateJam({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const userId = (session?.user as _Session)?.userId

  if (!params.id) { throw `Jam Submission SongId: ${params.id} Not Provided.` }
  const songId = params.id
  console.log(`PAGE: /jam/start/song/${songId}`)

  const req = {
    headers: {
      cookie: headers().get('cookie'),
    },
  }
  const client = generateClient()
  let d = null as Song | null

  try {
    const { data } = await client.graphql({ 
      query: q.getSong, variables: { songId: params.id as string, userId }
    }) as GraphQLResult<{  getSong: Song }>
    console.log(data)
    if (data?.getSong) d = data.getSong
    else throw new Error("No song found")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <SongPreviewContextProvider>
      <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
        <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
            <Image src={d?.albumCover || ""} alt={""} width={192} height={192} className="w-48 m-2 mx-auto" />
            <div className="mt-6">
              <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:text-5xl dark:text-gray-100">{d?.title}</h1>
              <p className="mb-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-blue-300">
                {d?.artist} - {d?.album}
              </p>
            </div>
        </div>
        <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900 w-full h-full absolute top-0 left-0 z-0"></div>
      </section>
      <div>
        {d && <KeySelector song={d} />}
      </div>
    </SongPreviewContextProvider>
  </>
}