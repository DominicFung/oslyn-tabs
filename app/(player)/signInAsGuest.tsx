"use client"

import { QuestionMarkCircleIcon } from "@heroicons/react/24/solid"
import { useState } from "react"

interface SignInAsGuestProps {
  jamId: string
  signInAsGuest: (name: string, colour: string) => Promise<string>

  open: boolean
  setOpen: (b: boolean) => void
}

const COLORS = [ 
  "random", "red", "orange", "amber", "yellow", "lime", 
  "green", "emerald", "teal", "cyan", "sky", "blue", 
  "indigo", "violet", "purple", "fuchsia", "pink", "rose"
]

export default function SignInAsGuest(p: SignInAsGuestProps) {

  const [name, setName] = useState("")
  const [color, setColor] = useState(0)

  const [error, setError] = useState("")

  const signin = async (name: string, colour: string) => {
    let e = await p.signInAsGuest(name, colour)
    if (e) setError(e)
  }

  return <>
    <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${p.open?"":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(110%)] max-h-full bg-gray-900/75`}>
      <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="px-6 py-6 lg:px-8">
              <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Guest</h3>
              <p className="mb-6 text-sm font-normal dark:text-gray-400 text-gray-800">Please enter a nickname:</p>
              <span className="space-y-2">

              <div className='flex-1'>
                <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
                  value={name}  placeholder="Nickname ie. Dom, Tiff .." onChange={(e) => {setName(e.target.value); setError("")}}/>
                <span className="text-xs italic text-red-500">{error}</span>
              </div>

              <div className="px-2 py-4 grid grid-cols-9 gap-2">
                {COLORS.map((e, i) => {
                  if (e !== "random") 
                    return  <button key={i} onClick={() => setColor(i)}
                              className={`h-8 w-8 p-2 rounded-full bg-${e}-500 ${i === color ? "border-2 border-gray-600": "border border-gray-400"}`}>
                            </button>
                  else return <button key={i} onClick={() => setColor(i)}
                                  className={`h-8 w-8 rounded-full ${i === color ? "border-2 border-gray-600": "border border-gray-400"}`}>
                                <QuestionMarkCircleIcon className={`w-6 h-6 mx-auto ${i === color ?"text-gray-600": "text-gray-400"}`} />
                              </button>
                })}
              </div>

                <button onClick={() => { signin(name, COLORS[color]) } } disabled={ name === "" || error != "" }
                    className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800 disabled:bg-gray-300 disabled:dark:bg-gray-700">
                      <div className='flex-1' />
                      <div className="px-10 py-2.5">Ok</div>
                      <div className='flex-1' />
                </button>

                <div className="pt-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                    I want to sign in instead. <a href={`/jam/${p.jamId}?login=true`} className="text-blue-700 hover:underline dark:text-blue-500">Sign in</a>
                </div>

              </span>
          </div>
        </div>
        <div className='flex-1' />
      </div>
    </div>
  </>
}