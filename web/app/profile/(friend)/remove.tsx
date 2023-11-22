"use client"

import { useState } from "react"
import { User, Song } from "@/../src/API"
import { useRouter } from "next/navigation"

import { UserMinusIcon } from "@heroicons/react/24/solid"
import { RemoveFriendRequest } from "@/app/api/profile/friends/remove/route"

export interface RemoveFriendProps {
  user: User,
  friendId: string,
  friendUserName: string,
}

export default function RemoveFriend(p: RemoveFriendProps) {
  const router = useRouter()
  const [ open, setOpen ] = useState(false)

  const remove = async () => {
    if (!p.user.userId) { console.error("userId should be available"); return }

    const data = await (await fetch(`/api/profile/friends/remove`, {
      method: "POST",
      body: JSON.stringify({ friendId: p.friendId } as RemoveFriendRequest)
    })).json() as Song

    console.log(data)
    router.refresh()
  }

  return <>
    <div className="flex flex-row">
      <button type="button" onClick={() => { setOpen(true) }}
          className="mx-5 my-2 text-white bg-gradient-to-br from-purple-600 to-oslyn-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-oslyn-300 dark:focus:ring-oslyn-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2">
        <UserMinusIcon className="w-4 h-4" />
      </button>
    </div>

    <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${open?"":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-full max-h-full bg-gray-900/75`}>
      <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="w-full">

          <div className="px-6 py-6 lg:px-8">
            <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Remove Friend</h3>
            <span className="space-y-6">
                <span>
                  By removing <span className="font-bold text-white">{p.friendUserName}</span>, you will nolonger be able to see all their songs. Do you want to proceed?
                </span>
                
                <button onClick={remove}
                  className="w-full text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800">Remove</button>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                    Read more? <a href="#" className="text-red-700 hover:underline dark:text-blue-500">Instructions</a>
                </div>
            </span>
          </div>

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