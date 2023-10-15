"use client"

import Image from "next/image"
import { Band, JamSession } from "@/src/API"

import ClickableCell from "./(components)/clikableCell"
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid"

import BandCard from "./(components)/bandCard"
import { getTimeDifferenceFromNowToEpoch } from "@/core/utils/frontend"
import { useSideBarContext } from "./context"

interface MainProps {
  bands: Band[]
  sessions: JamSession[]
}

export default function Main(p: MainProps) {
  const { openSidebar } = useSideBarContext()

  return <main className={`${openSidebar?"min-w-[640px]":""}`}>
  <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
    <div className="pt-8 px-4 pb-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:pb-4 z-10 relative">
      <a href="#" className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-oslyn-700 bg-oslyn-100 rounded-full dark:bg-oslyn-900 dark:text-oslyn-300 hover:bg-oslyn-200 dark:hover:bg-oslyn-800">
          <span className="text-xs bg-oslyn-600 rounded-full text-white px-4 py-1.5 mr-3">New</span> <span className="text-sm font-medium">Upload your chord sheets today!</span> 
          <svg aria-hidden="true" className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
      </a>
      <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Jam Now!</h1>

      <div className="relative overflow-x-auto shadow-md rounded-md sm:rounded-lg mx-5">
        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                  <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                      #
                  </th>
                  <th scope="col" className="px-6 py-3">
                      Room ID or Description
                  </th>
                  <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                      Active Users
                  </th>
                  <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                      Time
                  </th>
                  <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                      Action
                  </th>
              </tr>
          </thead>
          <tbody>
              {p.sessions.map((a, i) => <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                  
                    <ClickableCell href={`/jam/${a.jamSessionId}`} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white hidden sm:table-cell">
                      {i+1}
                    </ClickableCell>
                  
                    <ClickableCell href={`/jam/${a.jamSessionId}`} className="px-6 py-4 text-ellipsis">
                      <div className="flex-0 m-2 w-36 lg:w-full">
                        <div className="text-base dark:text-white text-gray-800 bold truncate">{a.description || a.setList.description }</div>
                        <div className="text-xs text-ellipsis truncate">{a.jamSessionId}</div>
                      </div>
                    </ClickableCell>
                    <ClickableCell href={`/jam/${a.jamSessionId}`} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                      <div className="flex flex-row">
                        { a.active.map((a, i) => {
                          if (i < 5) 
                            return  <div className="m-auto w-16">
                                      { a?.imageUrl &&  <Image src={a?.imageUrl} alt={""} width={40} height={40} className="w-10 m-2"/> }
                                    </div>
                          else return <></>
                        })}
                      </div>
                    </ClickableCell>
                    <ClickableCell href={`/jam/${a.jamSessionId}`} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                      <div className="flex flex-row bg-gray-500 border-gray-300 text-sm px-2 py-1 border text-center rounded-md">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true" className="w-4 h-4 m-1 mt-1 text-gray-300" viewBox="0 0 20 20">
                        <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"></path>
                      </svg>
                      <span className="flex-1 text-center pt-0.5 text-white">{getTimeDifferenceFromNowToEpoch(a.startDate!)} ago</span>
                      </div>

                    </ClickableCell>
                  
                  <td className="px-6 py-4 hidden sm:table-cell">
                    <div className="flex flex-row">
                      <a href={`/jam/${a.jamSessionId}`}>
                        <button type="button" className="flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2">
                          <span className='text-md pt-0.5'>Join</span>
                          <ArrowRightOnRectangleIcon className="ml-2 w-4 h-4 mt-1" />
                        </button>
                      </a>
                    </div>
                  </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </section>
  
  <div className="relative z-20">
    <div className="pt-8 px-6 text-lg font-bold dark:text-white text-gray-700">Artists and Bands:</div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 m-5 gap-2">
      { p.bands.map((b, i) => <div key={i}>
            <BandCard band={b} />
          </div>
      )}
    </div>
  </div>
</main>
}