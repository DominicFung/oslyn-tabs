"use client"
import Image from 'next/image'

import Slides from "@/app/(slides)/slides"
import { JamSong } from "@/src/API"
import { PencilIcon, PhotoIcon, XMarkIcon } from "@heroicons/react/24/solid"
import { useState, useCallback } from "react"

import Background from './(editSlides)/background'
import Text from './(editSlides)/text'

interface EditSlidesProps {
  song: JamSong
}

export default function EditSlides(p: EditSlidesProps) {
  const [ open, setOpen ] = useState(true)

  const [ option, setOption ] = useState(0)
  const [ options, setOptions ] = useState([
    { name: "Background", disabled: false },
    { name: "Text", disabled: false },
    { name: "CCLI", disabled: false },
  ])

  return <>
    <Slides song={p.song} page={2} />

    <aside id="cta-button-sidebar" className={`fixed top-0 right-0 z-40 w-screen md:w-96 h-screen transition-transform ${open?"translate-x-0":"translate-x-full"}`} aria-label="Sidebar">
      <div className={`relative h-0 w-0 top-4 ${open?"right-6":"right-20"}`}>
        <button onClick={() => setOpen(!open)}
          className="z-90 bg-gray-50 dark:bg-gray-700 w-12 h-12
          rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300"
        >
          {open ? <XMarkIcon className="w-16 h-16 dark:text-white text-gray-700"/> :
          <PencilIcon className="w-16 h-16 dark:text-white text-gray-700"/> }
        </button>
      </div>
    
      <div className="flex flex-col h-full px-3 py-4 pt-4 overflow-y-auto bg-gray-50 dark:bg-gray-800">

        <div className='mx-4 my-2'>
          <ul className="hidden text-sm font-medium text-center text-gray-500 divide-x divide-gray-200 rounded-lg shadow sm:flex dark:divide-gray-700 dark:text-gray-400">
            { options.map((m,i) => {
              let selected = i === option
              let first = i === 0
              let last = i === options.length - 1
              
              return <li className="w-full" key={i}>
                      <button onClick={() => setOption(i)}
                        className={`inline-block w-full p-4 ${
                          selected ? "text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white active": "bg-white hover:text-gray-700 hover:bg-gray-50 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"} ${
                            first && "rounded-l-lg" } ${ last && "rounded-r-lg" } focus:ring-4 focus:ring-oslyn-300 focus:outline-none focus:z-10 relative`} aria-current="page">
                          {m.name}
                      </button>
                    </li>
            })}
          </ul>
        </div>
        
        
        { option === 0 && <Background song={p.song} />}
        { option === 1 && <Text />}

      </div>
    </aside>
  </>
}