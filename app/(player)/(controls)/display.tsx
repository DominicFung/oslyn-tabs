"use client"

import { ArrowsUpDownIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { capitalizeFirstLetter } from "@/core/utils/frontend"

export interface DisplayProps {
  textSize: string
  setTextSize:  (s: string) => void
  
  auto: boolean
  setAuto: (b: boolean) => void

  complex: boolean
  setComplex: (b: boolean) => void

  fullScreen: boolean
  setFullScreen: (b: boolean) => void

  headsUp: boolean
  setHeadsUp: (b: boolean) => void
}

const textSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl']
const MODE = ["dark", "light", "system"]

export default function Display(p: DisplayProps) {

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [ mode, setMode ] = useState(theme || "dark")

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setTheme(mode) }, [mode])
  useEffect(() => { if (theme && theme != mode) { setMode(theme) }}, [theme])

  return <>
    <div className="ml-3 text-sm font-normal w-[calc(100vw-4rem)] sm:w-full">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Display</div>
      <div className="pb-3 text-sm font-normal">Set your text size to make it easier to read! <span className="text-xs italic">(only affects you)</span></div> 

      <div className="max-h-[calc(100vh-10rem)] overflow-auto">
        <div className='flex-0'>
          <Listbox as="div" value={p.textSize} onChange={(e) => { p.setTextSize(e)}} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
          {({ open }) => (
            <>
            <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
              <span className="p-1 px-4 text-sm truncate">{p.textSize}</span>
              <span className="absolute flex items-center ml-3 pointer-events-none right-1">
              <ArrowsUpDownIcon
                className={`"w-4 h-4 ${open ? "text-blue-500" : "text-gray-400"}`}
              />
            </span>
            </Listbox.Button>
            <Transition
              show={open}
              as={Fragment}
              enter="transition ease-in-out duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition ease-out duration-75"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options static
                className="absolute left-0 z-40 max-h-64 w-full mt-2 origin-top-left rounded-base shadow-sm outline-none overflow-auto border border-gray-200 bg-neutral-50 dark:bg-neutral-800 dark:border-gray-700 py-1.5 px-1.5 space-y-1"
              >
                {textSizes.map((ts) => (
                  <Listbox.Option
                    className="relative"
                    key={ts}
                    value={ts}
                  >
                    {({ active, selected, disabled }) => (
                      <button
                        disabled={disabled}
                        aria-disabled={disabled}
                        className={`flex items-center w-full px-4 pl-4 h-9 border-0 flex-shrink-0 text-sm text-left cursor-base font-normal focus:outline-none rounded-base
                          ${active && "bg-neutral-100 dark:bg-neutral-700"}
                          ${selected && "bg-oslyn-100 text-oslyn-800 dark:bg-oslyn-600 dark:bg-opacity-15 dark:text-oslyn-100"}`}
                      >
                        <span
                          className={`flex-1 block truncate ${selected ? "font-semibold" : "font-normal"}`}
                        >
                          {ts}
                        </span>
                      </button>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
            
            </>
          )}
          </Listbox>
        </div>

        <div className="flex mt-10 mb-5">
          <div className="flex items-center h-5">
            <input id="helper-checkbox" aria-describedby="helper-checkbox-text" type="checkbox" value="" checked={p.complex} onChange={() => p.setComplex(!p.complex)}
                className="w-4 h-4 text-oslyn-600 bg-gray-100 border-gray-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="ml-2 text-sm">
            <label htmlFor="helper-checkbox" className="font-medium text-gray-900 dark:text-gray-300">Chord Complexity</label>
            <p id="helper-checkbox-text" className="text-xs font-normal text-gray-500 dark:text-gray-300">Check this off for chord decorators. Uncheck to simplify.</p>
          </div>
        </div>

        <div className="flex mt-10 mb-5">
          <div className="flex items-center h-5">
            <input id="helper-checkbox2" aria-describedby="helper-checkbox-text" type="checkbox" value="" checked={p.fullScreen} onChange={() => p.setFullScreen(!p.fullScreen)}
                className="w-4 h-4 text-oslyn-600 bg-gray-100 border-gray-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="ml-2 text-sm">
            <label htmlFor="helper-checkbox2" className="font-medium text-gray-900 dark:text-gray-300">Full Screen</label>
            <p id="helper-checkbox-text" className="text-xs font-normal text-gray-500 dark:text-gray-300">Have the application take full screen.</p>
          </div>
        </div>

        <div className="flex mt-10 mb-5">
          <div className="flex items-center h-5">
            <input id="helper-checkbox2" aria-describedby="helper-checkbox-text" type="checkbox" value="" checked={p.headsUp} onChange={() => p.setHeadsUp(!p.headsUp)}
                className="w-4 h-4 text-oslyn-600 bg-gray-100 border-gray-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div className="ml-2 text-sm">
            <label htmlFor="helper-checkbox2" className="font-medium text-gray-900 dark:text-gray-300">Heads Up!</label>
            <p id="helper-checkbox-text" className="text-xs font-normal text-gray-500 dark:text-gray-300">Have the application show the first line of the next slide.</p>
          </div>
        </div>

        <div className="flex mt-10 mb-5">
          { mounted && <div className="mt-6 w-full mx-2 max-w-sm relative z-10">
            <ul className="hidden text-sm font-medium text-center text-gray-500 divide-x divide-gray-200 rounded-lg shadow sm:flex dark:divide-gray-700 dark:text-gray-400">
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
        </div>

      </div>
    </div>
  </>
}