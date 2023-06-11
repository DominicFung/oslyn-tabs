"use client"

import { ArrowsUpDownIcon, Cog6ToothIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'
import { Fragment, useState } from "react"

export interface ControlsProp {
  capo: string
  setCapo:  (capo: string) => void

  pt?: boolean | undefined
}

const capos = ["0", "1", "2", "3", "4", "5", "6", "7"]

export default function Controls(p: ControlsProp) {
  const [ open, setOepn ] = useState(false)

  return <>
    { open && <div id="toast-bottom-right" 
    className={`fixed max-w-xs flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-10 ${p.pt?"top-32":"top-4"} dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800`} role="alert">
        <div className="text-sm font-normal">
          <div className="flex">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-oslyn-500 bg-oslyn-100 rounded-lg dark:text-oslyn-300 dark:bg-oslyn-900">
              <Cog6ToothIcon className="w-5 h-5" />
            </div>
            <div className="ml-3 text-sm font-normal">
              <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Capo</div>
              <div className="pb-3 text-sm font-normal">Set your Capo to make chords easier to play! <span className="text-xs italic">(only affects you)</span></div> 

              <div className='flex-0'>
                <Listbox as="div" value={p.capo} onChange={(e) => { p.setCapo(e)}} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
                {({ open }) => (
                  <>
                  <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
                    <span className="p-1 px-4 text-sm truncate">{p.capo}</span>
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
                      className="absolute left-0 z-40 max-h-64 w-full mt-2 origin-top-left rounded-base shadow-sm outline-none overflow-auto border border-gray-200 dark:bg-neutral-800 dark:border-gray-700 py-1.5 px-1.5 space-y-1"
                    >
                      {capos.map((capo) => (
                        <Listbox.Option
                          className="relative"
                          key={capo}
                          value={capo}
                        >
                          {({ active, selected, disabled }) => (
                            <button
                              disabled={disabled}
                              aria-disabled={disabled}
                              className={`flex items-center w-full px-4 pl-4 h-9 border-0 flex-shrink-0 text-sm text-left cursor-base font-normal focus:outline-none rounded-base
                                ${active && "bg-neutral-100 dark:bg-neutral-700"}
                                ${selected && "bg-blue-50 text-blue-800 dark:bg-blue-200 dark:bg-opacity-15 dark:text-blue-200"}`}
                            >
                              <span
                                className={`flex-1 block truncate ${selected ? "font-semibold" : "font-normal"}`}
                              >
                                {capo}
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
            </div>
            <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close"
              onClick={() => setOepn(false)}
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
    </div> }
    { !open && <button onClick={() => setOepn(true)}
      className={`fixed z-90 right-10 ${p.pt ?"top-32":"top-4"} bg-coral-400 w-12 h-12 rounded-lg p-2 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl`}
    >
      <Cog6ToothIcon className="w-8 h-8 text-oslyn-800 hover:text-oslyn-900" />
    </button>}
  </>
}