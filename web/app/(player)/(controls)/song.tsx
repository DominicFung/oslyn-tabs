"use client"

import { useEffect, useState } from "react"
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/solid"
import { JamSong } from "@/../src/API"

interface SongProps {
  jamSessionId: string
  song: number
  setSong: (n: number) => void
  addToQueue?: (songId: string) => void

  songs: JamSong[]
}

export default function SongControl(p: SongProps) {
  const [ search, setSearch ] = useState("")
  const [ filteredList, setFilteredList] = useState(p.songs)

  useEffect(() => { searchFunction() }, [search])

  const searchFunction = () => {
    if (search === "") { setFilteredList(p.songs); return } 

    let list = []
    let normalized = search.toLowerCase().trim()
    let words = normalized.split(/[\s,]+/).filter((word: string) => word.length > 0);

    for (let s of p.songs) {
      let title = s.song.title.toLowerCase().trim()
      let artists = s.song.artist?.toLocaleLowerCase().trim()
      
      for (let w of words) {
        if (title.includes(w)) { list.push(s); break; }
        if (artists?.includes(w)) { list.push(s); break; }
      }
    }

    setFilteredList(list)
  }

  return <div className="ml-3 text-sm font-normal w-full">
    <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Song</div>
    <div className="pb-3 text-sm font-normal">Choose a new Song! <br /><span className="text-xs italic">Note: this affects everyone in the session.</span></div> 

    <div className="w-full flex mb-6 pl-6">
      <input type="text" name="search" id="search" value={search} onChange={(e) => { setSearch(e.currentTarget.value) }}
        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" placeholder="Holy Forever ..." 
        required />
      <button type="button" onClick={searchFunction} className="sm:flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center mx-2 hidden">
        <MagnifyingGlassIcon className="w-4 h-4 mt-1" />
      </button>
    </div>

    <div className="max-h-[calc(100vh-14rem)] overflow-auto w-full">
      <ul className="divide-y divide-gray-200 dark:divide-gray-700 w-full">
        { filteredList.map((e, i) => 
          <li className="py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i}>
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0" onClick={() => { console.log("clicked"); p.setSong(i) }}>
                  {e.song.albumCover && <img className="w-8 h-8 rounded-full" src={e.song.albumCover} alt="Neil image" />}
              </div>
              <div className="flex-1 min-w-0" onClick={() => { console.log("clicked"); p.setSong(i) }}>
                  <p className="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {e.song.title}
                  </p>
                  <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                    {e.song.artist} | {e.song.album}
                  </p>
              </div>
              <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2" onClick={() => { console.log("clicked"); p.setSong(i) }}>
                {e.key}
              </div>
              { p.addToQueue ? <div className="flex-0 min-w-0">
              <button type="button" onClick={() => { console.log(`add "${e.song.title}" to queue`); p.addToQueue!(e.song.songId)}} className="sm:flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center mx-2 hidden">
                <PlusIcon className="w-4 h-4 mt-1" />
              </button>
              </div> : <></>}
            </div>
          </li>
        )}
      </ul>
    </div>
  </div>
}