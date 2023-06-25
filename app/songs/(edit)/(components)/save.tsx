"use client"

import { SongUpdateRequest } from "@/app/api/song/[id]/update/route"
import { SongRequest } from "@/app/api/song/create/route"
import { Song } from "@/src/API"
import { InboxArrowDownIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"
import { useState } from "react"

export interface SaveProps {
  song: Song,
  type: "create" | "update"
}

export default function Save(p: SaveProps) {
  const router = useRouter()

  const [ saveMenu, setSaveMenu ] = useState(false)

  const updateSong = async () => {
    if (!p.song.songId) { console.error("songId not available"); return }
    const data = await (await fetch(`/api/song/${p.song?.songId}/update`, {
      method: "POST",
      body: JSON.stringify({...p.song} as SongUpdateRequest)
    })).json() as Song
    console.log(data)
  }

  const createSong = async () => {
    if (!p.song.title || !p.song.chordSheetKey) { console.error("title and key not available"); return }

    const data = await (await fetch(`/api/song/create`, {
      method: "POST",
      body: JSON.stringify({
        title: p.song.title, chordSheetKey: p.song.chordSheetKey,
        artist: p.song.artist, album: p.song.album, 
        albumCover: p.song.albumCover, chordSheet: p.song.chordSheet
      } as SongRequest)
    })).json() as Song
    console.log(data)

    router.push(`/songs`)
  }

  return <>
  { saveMenu && <div id="toast-bottom-right" className="fixed flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-5 bottom-5 dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800" role="alert">
        <div className="text-sm font-normal">
          <div className="flex">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:text-blue-300 dark:bg-blue-900">
              <InboxArrowDownIcon className="w-5 h-5" />
            </div>
            <div className="ml-3 text-sm font-normal">
              <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">All Done?</span>
              <div className="mb-2 text-sm font-normal">Review the experience now!</div> 
              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <button disabled={p.song.chordSheet === "" || p.song.title === "" || p.song.chordSheetKey === "" } onClick={p.type === "create" ? createSong : updateSong}
                        className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 disabled:bg-gray-600">
                          Submit
                      </button>
                  </div>
                  <div>
                      <button className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">Not now</button> 
                  </div>
              </div>    
            </div>
            <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close"
              onClick={() => setSaveMenu(false)}
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
    </div> }
    {!saveMenu && <button onClick={() => setSaveMenu(true)}
      className="fixed z-90 bottom-10 right-8 bg-coral-400 w-16 h-16 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl"
    >
      <InboxArrowDownIcon className="w-8 h-8 text-oslyn-800 hover:text-oslyn-900" />
    </button>}
  </>

}
