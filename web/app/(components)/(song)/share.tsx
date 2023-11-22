"use client"

import { useState } from "react";
import Email from "./(share)/email";
import Friends from "./(share)/friend";
import { Song, User, Band } from "@/../src/API";

import { ShareIcon } from "@heroicons/react/24/solid"
import Bands from "./(share)/band";

export interface ShareSongProps {
  user: User,
  song: Song
}

export default function ShareSong(p: ShareSongProps) {
  const [ open, setOpen ] = useState(false)

  const [ options, _setOptions ] = useState([
    { name: "Email", disabled: false },
    { name: "Friends", disabled: false },
    { name: "Band", disabled: false },
  ])
  const [ option, setOption ] = useState(0)

  return <>
    <button type="button" onClick={() => setOpen(true)}
        className="flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-4 py-2.5 text-center mr-2 mb-2">
      <ShareIcon className="w-4 h-4 mt-1" />
    </button>
    <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${open?"":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-full max-h-full bg-gray-900/75`}>
      <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">

          <div className="flex">
            <div className="flex-shrink-0 flex flex-col space-y-2 m-2">
              {options.map((o, i) => 
                <button key={i} disabled={o.disabled} onClick={() => setOption(i)}
                  className={`px-4 py-2 shadow-md text-oslyn-500 bg-oslyn-100 rounded-md ${option === i ? "dark:text-white dark:bg-oslyn-800" : "dark:text-oslyn-300 dark:bg-oslyn-900"} dark:disabled:text-gray-400 dark:disabled:bg-gray-600`}>
                  {o.name}
                </button>
              )}
            </div>
            <>
              { option === 0 && <Email user={p.user} song={p.song} setClose={() => setOpen(false)} /> }
              { option === 1 && <Friends friends={p.user.friends as User[] || []} /> }
              { option === 2 && <Bands bands={p.user.bands as Band[] || []} song={p.song} setClose={() => setOpen(false)}  /> }
            </>

            <button type="button" onClick={() => setOpen(false)}
                className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal">
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
        </div>
        <div className='flex-1' />
      </div>
    </div>
  </>
}