"use client"

import { ArrowsUpDownIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'
import { useState } from "react"

export interface CapoProps {
  capo: string
  setCapo:  (capo: string) => void
}

const capos = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]

export default function Capo(p: CapoProps) {

  const [ isLead, setIsLead ] = useState(false)

  return <>
    <div className="ml-3 text-sm font-normal w-[calc(100vw-4rem)] sm:w-full">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Capo</div>
      <div className="pb-3 text-sm font-normal">Set your Capo to make chords easier to play! 
        { !isLead && <span className="text-xs italic">(only affects you)</span> }
      </div> 

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
                        ${selected && "bg-oslyn-100 text-oslyn-800 dark:bg-oslyn-600 dark:bg-opacity-15 dark:text-oslyn-100"}`}
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
      
      <div className="flex mt-10 mb-5">
        <div className="flex items-center h-5">
          <input id="helper-checkbox" aria-describedby="helper-checkbox-text" type="checkbox" value="" checked={isLead} onChange={() => setIsLead(!isLead)}
              className="w-4 h-4 text-oslyn-600 bg-gray-100 border-gray-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div className="ml-2 text-sm">
          <label htmlFor="helper-checkbox" className="font-medium text-gray-900 dark:text-gray-300">Lead Guarist?</label>
          <p id="helper-checkbox-text" className="text-xs font-normal text-gray-500 dark:text-gray-300">This will change the key for everyone else when you change the capo! <span className="text-xs italic">(Because you are the lead and you are all that matters. JK.)</span></p>
        </div>
      </div>
    </div>
  </>
}