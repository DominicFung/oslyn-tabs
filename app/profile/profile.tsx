"use client"

import Image from "next/image"
import { useState, useEffect } from "react"

import { useTheme } from "next-themes"
import { User } from "@/src/API"
import { capitalizeFirstLetter } from "@/core/utils/frontend"

interface ProfileProps {
  user: User
}

const MODE = ["dark", "light", "system"]

export default function Profile(p: ProfileProps) {
  const [user, setUser] = useState(p.user)

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [ mode, setMode ] = useState("dark")

  useEffect(() => { setMounted(true) }, [])
  
  useEffect(() => { setTheme(mode) }, [mode])
  useEffect(() => { console.log(theme) }, [theme])
  useEffect(() => { if (p.user) setUser(p.user) }, [p.user])

  return <div>
    <section className="bg-white dark:bg-gray-900 bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
      <div className="lg:pt-16 lg:pb-4 pt-8 pb-2 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
          <a href="#" className="inline-flex justify-between items-center py-1 px-1 pr-4 mb-7 text-sm text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800">
              <span className="text-xs bg-blue-600 rounded-full text-white px-4 py-1.5 mr-3">New</span> <span className="text-sm font-medium">Upload your chord sheets today!</span> 
              <svg aria-hidden="true" className="ml-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path></svg>
          </a>
          <div className="flex flex-row max-w-lg m-auto">

            { p.user.imageUrl && <Image src={p.user.imageUrl} className="h-24 rounded-full mr-6" width={96} height={96} alt="Oslyn Logo" /> }
            <h1 className="pt-4 mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">{user.username}</h1>
          </div>
      </div>
      <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-900 w-full h-full absolute top-0 left-0 z-0"></div>
    </section>

    { mounted && <div className="mt-6 mx-auto max-w-sm relative z-10">
      <ul className="hidden text-sm font-medium text-center text-gray-500 divide-x divide-gray-200 rounded-lg shadow sm:flex dark:divide-gray-700 dark:text-gray-400">
        { MODE.map((m,i) => {
          let selected = m === mode
          let first = i === 0
          let last = i === MODE.length - 1

          return <li className="w-full" key={i}>
            <button onClick={() => setMode(m)}
              className={`inline-block w-full p-4 ${
                selected ? "text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white active": "bg-white hover:text-gray-700 hover:bg-gray-50 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"} ${
                  first && "rounded-l-lg" } ${ last && "rounded-r-lg" } focus:ring-4 focus:ring-blue-300 focus:outline-none`} aria-current="page">
                {m !== "system" && capitalizeFirstLetter(m)} {m === "system"?"Auto":"Mode"}
            </button>
          </li>
        }) }
      </ul>
    </div> }
  </div>
}