"use client"

import { useEffect, useState } from "react"
import { JamSession, JamSongInput, SetList, Song } from "@/../src/API"
import { SetRequest } from "@/app/api/set/create/route"
import { useRouter } from "next/navigation"
import { JamRequest } from "@/app/api/jam/create/route"
import toast, { Toaster } from "react-hot-toast"

export interface CreateJamProps {
  bandName: string,
  songs: Song[]
}

export default function CreateJam(p: CreateJamProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [name, setName] = useState("")

  useEffect(() => {
    const currentDate = new Date()

    const year = currentDate.getFullYear();
    const month = currentDate.toLocaleString('default', { month: 'long' });
    const day = currentDate.getDate()

    setName(`${month} ${day}, ${year} - ${p.bandName}`)
  }, [])

  const createJam = async () => {
    // create Set
    const jamsongs = p.songs.map((a, i) => { 
      return { songId: a?.songId, key: a?.chordSheetKey || "C", order: i } as JamSongInput
    })
    const set = { description: name, songs: jamsongs } as SetRequest
    const a = await createSet(set)

    if (a?.setListId) {
      const setListId = a!.setListId
      console.log(`create jam for ${setListId}`)

      const data = await (await fetch(`/api/jam/create`, {
        method: "POST",
        body: JSON.stringify({ setListId } as JamRequest)
      })).json() as JamSession
      console.log(data)

      router.push(`/jam/${data.jamSessionId}`)
    } else {
      toast("Error: Could not create Set")
    }
  }

  const createSet = async (set: SetRequest) => {
    if (!set.description || !set.songs) { console.error("title and key not available"); return }

    const data = await (await fetch(`/api/set/create`, {
      method: "POST",
      body: JSON.stringify(set)
    })).json() as SetList
    console.log(data)
    return data
  }

  return <>
    <div className="flex flex-row-reverse z-10 relative">
      <button onClick={ () => { setOpen(true) } }
        className="text-white ml-5 my-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">Create Jam</button>
    </div>
    <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${open?"":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-full max-h-full bg-gray-900/75`}>
      <div className="relative w-full h-full max-w-lg xl:max-w-xl max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">

          <div className="mx-5 px-5 my-12">
            <div className="ml-3 text-sm font-normal">
              <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Create Jam</div>
              <div className="pb-3 text-sm font-normal text-gray-800 dark:text-gray-200">This will create a public set that will be started immidiately. Please choose the name of your jam session.</div> 
            </div>

            <div className='my-5 flex-1'>
              <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
                value={name}  placeholder="Nickname ie. Dom, Tiff .." onChange={(e) => {setName(e.target.value)}}/>
            </div>

            <button onClick={() => { createJam() } } disabled={ name === "" }
                className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800 disabled:bg-gray-300 disabled:dark:bg-gray-700">
                  <div className='flex-1' />
                  <div className="px-10 py-2.5">Ok</div>
                  <div className='flex-1' />
            </button>
          </div>

          

          <button type="button" onClick={() => setOpen(false)}
              className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal">
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            <span className="sr-only">Close modal</span>
          </button>

        </div>
        <div className='flex-1' />
      </div>
    </div>
    <Toaster position="bottom-left" />
  </>
}