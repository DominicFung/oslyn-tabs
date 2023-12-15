"use client"

import { useEffect, useState } from "react"
import { useSideBarContext } from "./context"
import { useSession } from 'next-auth/react'

interface UnauthProps {
  statusCode?: any
  message?: string
}

const defaultMessage = "You are not authorized! Please Login."

export default function Unauth(p: UnauthProps) {
  const { setOpenLogin } = useSideBarContext()
  const { data: session, status } = useSession()

  const [ message, setMessage ] = useState(defaultMessage)

  //const message = "You are not authorized! Please Login."

  useEffect(() => {
    if (session?.user && p.message) { setMessage(`Hey ${session.user.name || "There"}! ${p.message}`) }
    if (p.message) { setMessage(p.message); return }
    if (session?.user) { setMessage(`Hey ${session.user.name || "There"}! Looks like this page doesn't exist or you don't have authorization to access.`); return }
    setMessage(defaultMessage)
  }, [session, p.message])

  return <div className={`flex flex-row w-full h-[100vh] text-center align-middle justify-center`}>
    <div className="text-white flex flex-col">
      <div className="flex-1" />
      <div>
        <h1 className="inline-block mr-5 pr-6 text-2xl bold align-middle border-r border-gray-400">
          { p.statusCode || "404" }
        </h1>
        <div className="inline-block text-sm">
          { p.message || message }
        </div>
      </div>
      { status != "authenticated" && <div className="mt-4 flex w-full text-center align-middle justify-center">
        <button onClick={() => { setOpenLogin(true) }}
          className="px-6 py-2 flex items-center p-2 text-gray-900 dark:text-gray-100 rounded-lg bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium text-sm text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
        <svg aria-hidden="true" className="flex-shrink-0 w-6 h-6 text-oslyn-400 transition duration-75 dark:text-oslyn-200 group-hover:text-gray-900 dark:group-hover:text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd"></path></svg>
        <span className="flex-1 ml-3 whitespace-nowrap text-left">Sign In</span></button>
      </div> }
      <div className="flex-1" />
    </div>
  </div>
}