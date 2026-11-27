"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { Band, JamSession } from "@/../src/API"

import ClickableCell from "./(components)/clikableCell"
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/solid"

import BandCard from "./(components)/bandCard"
import DeleteJamButton from "./(components)/deleteJam"
import { getTimeDifferenceFromNowToEpoch } from "@/core/utils/frontend"

function JamTable({ sessions, showPolicy }: { sessions: JamSession[], showPolicy?: boolean }) {
  const router = useRouter()
  return (
    <div className="relative mx-5 max-w-full overflow-hidden rounded-md shadow-md sm:rounded-lg">
      <table className="w-full table-fixed text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="hidden px-6 py-3 sm:table-cell sm:w-12">#</th>
                <th scope="col" className="px-3 py-3 sm:px-6">Room ID or Description</th>
                <th scope="col" className="hidden px-6 py-3 sm:table-cell">Active Users</th>
                <th scope="col" className="hidden px-6 py-3 sm:table-cell">Time</th>
                <th scope="col" className="w-20 px-2 py-3 sm:w-56 sm:px-6">Action</th>
            </tr>
        </thead>
        <tbody>
            {sessions.length === 0 && <tr className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
              <td colSpan={5} className="px-6 py-6 text-gray-500 dark:text-gray-300">No rooms right now.</td>
            </tr>}
            {sessions.map((a, i) => <tr key={a.jamSessionId || i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                  <ClickableCell href={`/jam/${a.jamSessionId}`} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white hidden sm:table-cell">
                    {i+1}
                  </ClickableCell>
                  <ClickableCell href={`/jam/${a.jamSessionId}`} className="min-w-0 px-3 py-3 sm:px-6 sm:py-4">
                    <div className="min-w-0">
                      <div className="truncate text-base font-bold text-gray-800 dark:text-white">
                        {a.description || a.setList?.description || "Jam room"}
                        {showPolicy && a.policy ? <span className="ml-2 text-xs font-medium uppercase text-gray-400">{a.policy}</span> : null}
                      </div>
                      <div className="truncate text-xs">{a.jamSessionId}</div>
                    </div>
                  </ClickableCell>
                  <ClickableCell href={`/jam/${a.jamSessionId}`} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                    <div className="flex flex-row">
                      {(a.active || []).map((participant, participantIndex) => {
                        if (participantIndex < 5)
                          return  <div key={participant?.user?.userId || participantIndex} className="m-auto w-16">
                                    { participant?.user?.imageUrl && <Image src={participant.user.imageUrl} alt={""} width={40} height={40} className="w-10 m-2" unoptimized/> }
                                  </div>
                        else return <span key={participantIndex} />
                      })}
                    </div>
                  </ClickableCell>
                  <ClickableCell href={`/jam/${a.jamSessionId}`} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                    <div className="flex flex-row bg-gray-500 border-gray-300 text-sm px-2 py-1 border text-center rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" aria-hidden="true" className="w-4 h-4 m-1 mt-1 text-gray-300" viewBox="0 0 20 20">
                      <path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"></path>
                    </svg>
                    <span className="flex-1 text-center pt-0.5 text-white">{a.startDate ? `${getTimeDifferenceFromNowToEpoch(a.startDate)} ago` : ""}</span>
                    </div>
                  </ClickableCell>
                <td className="px-2 py-3 sm:px-6 sm:py-4">
                  <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                    <a href={`/jam/${a.jamSessionId}`} className="inline-flex justify-center">
                      <button type="button" aria-label="Join" className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-500 px-2 py-2 text-sm font-medium text-white hover:bg-gradient-to-bl focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 sm:px-5 sm:py-2.5">
                        <span className="hidden sm:inline sm:pt-0.5">Join</span>
                        <ArrowRightOnRectangleIcon className="h-5 w-5 sm:ml-2 sm:h-4 sm:w-4" />
                      </button>
                    </a>
                    {showPolicy && <DeleteJamButton jamSessionId={a.jamSessionId} description={a.description || a.setList?.description} onDeleted={() => router.refresh()} />}
                  </div>
                </td>
            </tr>)}
        </tbody>
      </table>
    </div>
  )
}

export function JamLists({ sessions, mySessions }: { sessions: JamSession[], mySessions: JamSession[] | null }) {
  return <>
    {mySessions && <div className="mb-10">
      <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Your jam rooms</h2>
      {mySessions.length === 0
        ? <p className="mx-5 text-gray-500 dark:text-gray-300">You don&apos;t have any jam rooms yet. Start one above, or <a className="underline" href="/sets">create one from a set.</a></p>
        : <JamTable sessions={mySessions} showPolicy />}
    </div>}
    {mySessions && <h2 className="mb-4 text-left text-lg font-semibold text-gray-700 dark:text-gray-200">Public rooms</h2>}
    <JamTable sessions={sessions} />
  </>
}

export function BandGrid({ bands }: { bands: Band[] }) {
  return (
    <div className="relative z-20">
      <div className="pt-8 px-6 text-lg font-bold dark:text-white text-gray-700">Artists and Bands:</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 m-5 gap-2">
        {bands.map((b) => <div key={b.bandId}>
              <BandCard band={b} />
            </div>
        )}
      </div>
    </div>
  )
}
