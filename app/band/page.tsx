import { headers } from 'next/headers'

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import { getServerSession } from "next-auth/next"

import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import Unauth from "@/app/unauthorized"
import awsConfig from '@/src/aws-exports'
import * as q from '@/src/graphql/queries'

import { _Session } from "@/core/utils/frontend"
import { Band } from '@/src/API'
import Bands from './bands'
import { BandContextProvider } from './(context)/bandContext'
import BandTabs from './(components)/bandTabs'

Amplify.configure({...awsConfig, ssr: true })

export default async function Band() {
  const session = await getServerSession(authOptions)

  if (!(session?.user as _Session)?.userId) { return <Unauth /> }
  const name = session?.user?.name?.split(" ")[0]
  const userId = (session?.user as _Session)?.userId

  const req = { headers: { cookie: headers().get('cookie') } }
  const SSR = withSSRContext({ req })
  let d = [] as Band[]

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.listBands, { userId }
    )) as GraphQLResult<{ listBands: Band[] }>
    if (data?.listBands) d = data?.listBands
    else throw new Error("data.listBands is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <>
    <BandContextProvider>
      <section className="bg-white dark:bg-gray-900 bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
        <div className="lg:pt-16 lg:pb-4 pt-8 pb-2 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
            <a href="#" className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800">
                <span className="text-xs bg-blue-600 rounded-full text-white px-4 py-1.5 mr-3">New</span> <span className="text-sm font-medium">Upload your chord sheets today!</span> 
                <svg aria-hidden="true" className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
            </a>
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">{name ? `${name}'s` : "Your"} Bands</h1>
            <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-200">
              Organize your friends into bands!
            </p>
        </div>
        
        <div className="flex flex-row z-10 relative">
          <BandTabs bands={d} />
          <div className="flex-1" />
          <a href="/band/create">
            <button type="submit" className="text-white mx-5 my-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">+</button>
          </a>
        </div>
        <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900 w-full h-full absolute top-0 left-0 z-0"></div>
      </section>
      <Bands bands={d} />
    </BandContextProvider>
  </>
}