import Image from "next/image"
import { headers } from 'next/headers'
import KeySelector from "./keySelector"

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { Song } from '@/src/API'

const _img = "https://i.scdn.co/image/ab67616d00001e02b84fbe2988f4056c658634c8"

Amplify.configure({...awsConfig, ssr: true })

export default async function CreateJam({ params }: { params: { id: string } }) {

  if (!params.id) {
    throw `Jam Submission SongId: ${params.id} Not Provided.` 
  }

  const songId = params.id
  console.log(`PAGE: /jam/start/song/${songId}`)

  const req = {
    headers: {
      cookie: headers().get('cookie'),
    },
  }
  const SSR = withSSRContext({ req })
  let d = null as Song | null

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.getSong, { songId: params.id as string }
    )) as GraphQLResult<{  getSong: Song }>
    
    console.log(data)
    if (data?.getSong) d = data.getSong
    else throw new Error("No song found")

  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <section className="bg-white dark:bg-gray-900 bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
          <Image src={d?.albumCover || ""} alt={""} width={192} height={192} className="w-48 m-2 mx-auto" />
          <div className="mt-6">
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:text-5xl dark:text-gray-100">{d?.title}</h1>
            <p className="mb-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-blue-300">
              {d?.artist} - {d?.album}
            </p>
            <p className="mb-0 text-lg font-normal text-gray-500 lg:text-xl dark:text-gray-300">
              Choose your key to get started on your Jam!
            </p>
          </div>
      </div>
      <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900 w-full h-full absolute top-0 left-0 z-0"></div>
    </section>
    <div>
      {d && <KeySelector song={d} />}
    </div>
  </>
}