"use client"

import { useState } from "react"
import { User, Song } from "@/src/API"
import { AddFriendRequest } from "@/app/api/profile/friends/add/route"
import { useRouter } from "next/navigation"

interface EmailProps {
  user: User,
  setClose: () => void
}

export default function Email(p: EmailProps) {
  const router = useRouter()
  const [ email, setEmail ] = useState("")

  const share = async () => {
    if (!p.user.userId) { console.error("userId should be available"); return }

    const data = await (await fetch(`/api/profile/friends/add`, {
      method: "POST",
      body: JSON.stringify({ email: email } as AddFriendRequest)
    })).json() as Song

    console.log(data)
    p.setClose()
    router.refresh()
  }

  return <>
    <div className="px-6 py-6 lg:px-8">
      <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Add Friend</h3>
      <span className="space-y-6">
          <div>
            <label htmlFor="link" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Friend&apos;s Email</label>
            <input type="email" name="link" id="link" value={email} onChange={(e) => { setEmail(e.currentTarget.value) }}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" placeholder="john.doe@example.com" 
              required />
          </div>
          
          <button onClick={share}
            className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Invite</button>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
              How do I get a link? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Instructions</a>
          </div>
      </span>
    </div>
  </>
}