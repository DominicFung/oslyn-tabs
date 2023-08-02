"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { useTheme } from "next-themes"
import { User } from "@/src/API"
import { capitalizeFirstLetter } from "@/core/utils/frontend"
import { PowerIcon, UserMinusIcon } from "@heroicons/react/24/solid"

import { signOut } from 'next-auth/react'
import ClickableCell from "../(components)/clikableCell"
import InviteFriend from "./(friend)/invite"
import { useSideBarContext } from "../context"
import RemoveFriend from "./(friend)/remove"

interface ProfileProps {
  user: User
}

const MODE = ["dark", "light", "system"]

export default function Profile(p: ProfileProps) {
  const router = useRouter()
  const { openSidebar } = useSideBarContext()
  
  const [user, setUser] = useState(p.user)

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [ mode, setMode ] = useState(theme || "dark")

  useEffect(() => { setMounted(true) }, [])
  
  useEffect(() => { setTheme(mode) }, [mode])
  useEffect(() => { if (theme && theme != mode) setMode(theme)}, [theme])
  useEffect(() => { if (p.user) setUser(p.user) }, [p.user])

  return <div className={`${openSidebar?"min-w-[640px]":""}`}>
    <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
      <div className="lg:pt-16 lg:pb-4 pt-8 pb-2 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
          <a href="#" className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-oslyn-700 bg-oslyn-100 rounded-full dark:bg-oslyn-900 dark:text-oslyn-300 hover:bg-oslyn-200 dark:hover:bg-oslyn-800">
              <span className="text-xs bg-oslyn-600 rounded-full text-white px-4 py-1.5 mr-3">New</span> <span className="text-sm font-medium">Upload your chord sheets today!</span> 
              <svg aria-hidden="true" className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          </a>
          <div className="flex flex-row max-w-lg m-auto">

            { p.user.imageUrl && <Image src={p.user.imageUrl} className="h-24 rounded-full mr-6" width={96} height={96} alt="Oslyn Logo" /> }
            <h1 className="pt-4 mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">{user.username}</h1>
          </div>
      </div>

      <div className="flex flex-row-reverse z-10 relative">
          <button onClick={() => {signOut(); router.push("/profile")}}
              className="text-white mx-5 my-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
            <PowerIcon className="w-6 h-6" />
          </button>
      </div>
    </section>

    { mounted && <div className="mt-6 mx-auto max-w-sm relative z-10">
      <ul className="text-sm font-medium text-center text-gray-500 divide-x divide-gray-200 rounded-lg shadow flex dark:divide-gray-700 dark:text-gray-400">
        { MODE.map((m,i) => {
          let selected = m === mode
          let first = i === 0
          let last = i === MODE.length - 1

          return <li className="w-full" key={i}>
            <button onClick={() => setMode(m)}
              className={`inline-block w-full p-4 ${
                selected ? "text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white active": "bg-white hover:text-gray-700 hover:bg-gray-50 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"} ${
                  first && "rounded-l-lg" } ${ last && "rounded-r-lg" } focus:ring-4 focus:ring-oslyn-300 focus:outline-none focus:z-10 relative`} aria-current="page">
                {m !== "system" && capitalizeFirstLetter(m)} {m === "system"?"Auto":"Mode"}
            </button>
          </li>
        }) }
      </ul>
    </div> }

    <InviteFriend user={p.user} />
    <div className="relative overflow-x-auto shadow-md rounded-md sm:rounded-lg mx-5 mt-1">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-6 py-3">
                    #
                </th>
                <th scope="col" className="px-6 py-3">
                    Friend
                </th>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                    Email
                </th>
                <th scope="col" className="px-6 py-3 hidden sm:table-cell">
                    Role
                </th>
                <th scope="col" className="px-6 py-3">
                    Action
                </th>
            </tr>
        </thead>
        <tbody>
            {user.friends.map((a, i) => <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                  <ClickableCell href={`/user/${a?.userId}`} className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                    {i+1}
                  </ClickableCell>
                  <ClickableCell href={`/user/${a?.userId}`} className="px-6 py-4 text-ellipsis">
                      <div className="flex flex-row">
                        { a?.imageUrl && <div className="m-auto w-16">
                            <Image src={a.imageUrl} alt={""} width={40} height={40} className="w-10 m-2 rounded-full"/> 
                          </div>
                        }
                        <div className="flex-0 m-2 w-36 lg:w-full">
                          <div className="text-gray-900 dark:text-white font-bold truncate">{a?.username}</div>
                          <div className="text-xs text-ellipsis truncate">{a?.userId}</div>
                        </div>
                      </div>
                  </ClickableCell>
                  <ClickableCell href={`/user/${a?.userId}`} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                    {a?.email}
                  </ClickableCell>
                  <ClickableCell href={`/user/${a?.userId}`} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                    {a?.role}
                  </ClickableCell>
                <td className="px-6 py-4">
                  <RemoveFriend user={p.user} friendId={a?.userId || ""} friendUserName={a?.username || ""}/>
                </td>
            </tr>)}
        </tbody>
      </table>
    </div>
  </div>
}