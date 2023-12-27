"use client"

import { ArrowsUpDownIcon, EyeIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'

export interface KeyProps {
  skey: string
  setKey:  (capo: string) => void
  togglePreview?: () => void
}

const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']

export default function Key(p: KeyProps) {
  return <>
    <div className="ml-3 text-sm font-normal w-[calc(100vw-4rem)] sm:w-full">
      <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Key</div>
      <div className="pb-3 text-sm font-normal">Set the current song key for the entire team! <br /><span className="text-xs italic">Note: this affects everyone in the session.</span></div> 

      <div className='flex-0'>
        <Listbox as="div" value={p.skey} onChange={(e) => { p.setKey(e)}} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        {({ open }) => (
          <>
          <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
            <span className="p-1 px-4 text-sm truncate">{p.skey}</span>
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
              {chords.map((chord) => (
                <Listbox.Option
                  className="relative"
                  key={chord}
                  value={chord}
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
                        {chord}
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
        
      { p.togglePreview && <div className="py-5">
        <button onClick={p.togglePreview}
          className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-0.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
            <div className='flex-1' />
            <EyeIcon className="ml-10 m-2 w-6 h-6" />
            <div className="pr-10 py-2.5" >Toggle View</div>
            <div className='flex-1' />
        </button>
      </div> }
    </div>
  </>
}