"use client"

import { useState } from "react"
import { User } from "@/../src/API"
import { UserPlusIcon } from "@heroicons/react/24/solid"
import Email from "./email"

export interface InviteFriendProps {
  user: User
}

export default function InviteFriend(p: InviteFriendProps) {
  const [ open, setOpen ] = useState(false)

  return <>
    <div className="flex flex-row-reverse z-10 relative mt-10">
        <button onClick={() => { setOpen(true) }}
            className="text-white mr-5 ml-2 my-2 bg-gradient-to-br from-purple-600 to-oslyn-500 hover:to-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
          <UserPlusIcon className="w-5 h-5" />
        </button>
        <span className="mt-1 pt-4 font-bold dark:text-gray-200 text-oslyn-700 text-sm uppercase">Add Friend:</span>
    </div>
    <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${open?"":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-full max-h-full bg-gray-900/75`}>
      <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="w-full">
            <Email user={p.user} setClose={() => setOpen(false)} />
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