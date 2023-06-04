import Image from "next/image"
import { headers } from 'next/headers'

import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid"

import { Amplify, graphqlOperation, withSSRContext } from 'aws-amplify'
import { GraphQLResult } from "@aws-amplify/api"
import awsConfig from '@/src/aws-exports'

import * as q from '@/src/graphql/queries'
import { Song } from '@/src/API'

const _img = [
  "https://i.scdn.co/image/ab67616d0000485141e9614560815b11c1ca543d",
  "https://i.scdn.co/image/ab67616d00004851cc6c4df88e0b1c3022416010",
  "https://i.scdn.co/image/ab67616d000048512e07e8eb4aff6fd9fa61b7f4",
  "https://i.scdn.co/image/ab67616d00004851b424aeb510016daa1bc0251c",
  "https://i.scdn.co/image/ab67616d00004851457163bec7e8e4decf8c6375"
]

// TODO Remove
const _generalUserId = "3d7fbd91-14fa-41da-935f-704ef74d7488"

Amplify.configure({...awsConfig, ssr: true })

export default async function Songs() {
  // https://docs.amplify.aws/lib/ssr/q/platform/js/#2-prepare-a-request-object-for-withssrcontext-to-perform-server-side-operations-that-require-authentication

  const req = {
    headers: {
      cookie: headers().get('cookie'),
    },
  }
  const SSR = withSSRContext({ req })
  let d = [] as Song[]

  try {
    const { data } = await SSR.API.graphql(graphqlOperation(
      q.listSongs, { userId: _generalUserId }
    )) as GraphQLResult<{ listSongs: Song[] }>

    console.log(data)
    if (data?.listSongs) d = data?.listSongs
    else throw new Error("data.listSongs is empty.")
  } catch (e) {
    console.log(JSON.stringify(e, null, 2))
  }

  return <div>
    <section className="bg-white dark:bg-gray-900 bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
          <a href="#" className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800">
              <span className="text-xs bg-blue-600 rounded-full text-white px-4 py-1.5 mr-3">New</span> <span className="text-sm font-medium">Upload your chord sheets today!</span> 
              <svg aria-hidden="true" className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          </a>
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Dom's Songs</h1>
          <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-200">
            These are all the song's you've added. Share them with your friends!
          </p>
          <a href="/songs/create">
            <button type="submit" className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Add New Song</button>
          </a>
          
      </div>
      <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900 w-full h-full absolute top-0 left-0 z-0"></div>
    </section>
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-6 py-3">
                    #
                </th>
                <th scope="col" className="px-6 py-3">
                    Title
                </th>
                <th scope="col" className="px-6 py-3">
                    Key
                </th>
                <th scope="col" className="px-6 py-3">
                    Album
                </th>
                <th scope="col" className="px-6 py-3">
                    Action
                </th>
            </tr>
        </thead>
        <tbody>
            {d.map((a, i) => <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">{i+1}</th>
                <td className="px-6 py-4">
                  <a href={`/songs/edit/${a.songId}`}>                  
                    <div className="flex flex-row hover:cursor-pointer">
                      {a.albumCover && <Image src={a.albumCover} alt={""} width={40} height={40} className="w-10 m-2"/> }
                      <div className="m-2">
                        <div className="text-white bold">{a.title}</div>
                        <div>{a.artist}</div>
                      </div>
                    </div>
                  </a>
                </td>
                <td className="px-6 py-4">
                    {a.chordSheetKey}
                </td>
                <td className="px-6 py-4">
                    {a.album}
                </td>
                <td className="px-6 py-4">
                  <a href={`/jam/start/song/${a.songId}`}>
                    <button type="button" className="flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2">
                      Jam <ArrowRightOnRectangleIcon className="ml-2 w-4 h-4" />
                    </button>
                  </a>
                  
                </td>
            </tr>)}
        </tbody>
    </table>
</div>
  </div>
}