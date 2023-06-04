"use client"

import { Song } from "@/src/API"
import { useState } from "react"
import PasteTabs from "../../1.pasteTabs"
import SongInfo from "../../2.songInfo"
import Review from "../../3.review"

export interface EditProps {
  song: Song
}

export default function Edit(p: EditProps) {
  const [ step, setStep ] = useState(0)
  const [ song, setSong ] = useState(p.song)

  const updateSong = async () => {
    if (!song.songId) { console.error("songId not available"); return }
    const data = await (await fetch(`/api/song/create`, {
      method: "POST",
      body: JSON.stringify(song, null, 2)
    })).json() as Song
    console.log(data)
  }

  return <div className="text-white w-full">
    <ol className="m-4 flex items-center p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-lg shadow-sm dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4">
        <li className={`flex items-center ${step === 0 && "text-blue-600 dark:text-blue-500"}`}>
            <button className='flex flex-row' onClick={() => setStep(0)}>
              <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 0 ? "dark:border-blue-500": "border-gray-500 dark:border-gray-400"}`}>1</span>
              Paste Text
            </button>
            <svg aria-hidden="true" className="w-4 h-4 ml-2 sm:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </li>
        <li className={`flex items-center ${step === 1 && "text-blue-600 dark:text-blue-500"}`}>
          <button className='flex flex-row' onClick={() => setStep(1)}>
            <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 1 ? "dark:border-blue-500": "border-gray-500 dark:border-gray-400"}`}>2</span>
            Song Info
          </button>
            <svg aria-hidden="true" className="w-4 h-4 ml-2 sm:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </li>
        <li className={`flex items-center ${step === 2 && "text-blue-600 dark:text-blue-500"}`}>
          <button className='flex flex-row' onClick={() => setStep(2)}>
            <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 2 ? "dark:border-blue-500": "border-gray-500 dark:border-gray-400"}`}>3</span>
            Review Experience
          </button>
        </li>
    </ol>
    <div className="p-4">
      { step === 0 && <PasteTabs tabs={song.chordSheet || ""} setTabs={(t: string) => { setSong({ ...song, chordSheet: t }) }} /> }
      { step === 1 && <SongInfo song={song} setSong={setSong}/>}
      { step === 2 && <Review song={song} /> }
    </div>
    <div id="toast-bottom-right" className="fixed flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-5 bottom-5 dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800" role="alert">
        <div className="text-sm font-normal">
          <div className="flex">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:text-blue-300 dark:bg-blue-900">
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path></svg>
              <span className="sr-only">Refresh icon</span>
            </div>
            <div className="ml-3 text-sm font-normal">
              <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">All Done?</span>
              <div className="mb-2 text-sm font-normal">Review the experience now!</div> 
              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <button disabled={p.song.chordSheet === "" || p.song.title === "" || p.song.chordSheetKey === "" } onClick={updateSong}
                        className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 disabled:bg-gray-600">
                          Submit
                      </button>
                  </div>
                  <div>
                      <button className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">Not now</button> 
                  </div>
              </div>    
            </div>
            <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close">
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
    </div>
  </div>
}