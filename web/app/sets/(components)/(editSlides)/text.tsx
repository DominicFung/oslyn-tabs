"use client"

import { useState } from 'react'
import { ChromePicker } from 'react-color'

import { ArrowsUpDownIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'
import { Fragment } from "react"

const OP = ["0", "5", "10", "20", "25", "30", "40", "50", "60", "70", "75", "80", "90", "95", "100"]

export default function Text() {

  const [ textColor, setTextColor ] = useState("#fff")
  const [ opacity, setOpacity ] = useState("25")

  return <>
    <div className='ml-6'>
      <span className='dark:text-gray-300 text-2xl bold py-4' >Text</span><br />
      <span className='dark:text-gray-500 text-xs py-4'>
        Choose Text, and text highlight, as well as opacity here.
      </span>
    </div>

    <div className='mx-auto mt-4'>
      <ChromePicker
          color={textColor}
          onChange={(c) => { setTextColor(c.hex) }}
        />
    </div>

    <div className='flex-0 mt-4'>
        <Listbox as="div" value={opacity} onChange={(e) => { setOpacity(e)}} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
        {({ open }) => (
          <>
          <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
            <span className="p-1 px-4 text-sm truncate">{opacity}&#37;</span>
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
              {OP.map((o) => (
                <Listbox.Option
                  className="relative"
                  key={o}
                  value={o}
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
                        {o}&#37;
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
  
  </>
}