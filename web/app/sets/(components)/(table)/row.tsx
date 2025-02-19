"use client"
import Image from "next/image"
import { Song } from "@/../src/API"

import { Listbox, Transition } from '@headlessui/react'
import { ArrowsUpDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'

interface RowProps {
  song: Song

  checked: boolean
  setChecked: (b: boolean) => void

  skey: string,
  setKey: (s: string) => void

  setPreview: (s: string) => void
}

export const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']

export default function Row(p: RowProps) {
  return <>
  <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
    <input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 text-oslyn-600 bg-coral-100 border-coral-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
      checked={p.checked} onChange={() => { p.setChecked(!p.checked) }}
    />
  </th>
  <td className="px-6 py-4">
    <a href={`/songs/edit/${p.song.songId}`}>                  
      <div className="flex flex-row hover:cursor-pointer">
        {p.song.albumCover && <Image src={p.song.albumCover} alt={""} width={40} height={40} className="w-10 m-2" unoptimized/> }
        <div className="m-2">
          <div className="dark:text-white text-oslyn-900 bold">{p.song.title}</div>
          <div>{p.song.artist}</div>
        </div>
      </div>
    </a>
  </td>
  <td className="px-6 py-4">
      {!p.checked && p.song.chordSheetKey}
      {p.checked && <Listbox as="div" value={p.skey} onChange={(e) => { p.setKey(e) }} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
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
            <Listbox.Options
              className="absolute left-0 z-50 max-h-64 w-full mt-2 origin-top-left rounded-base shadow-sm outline-none overflow-auto border border-gray-200 bg-neutral-50 dark:bg-neutral-800 dark:border-gray-700 py-1.5 px-1.5 space-y-1"
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
      </Listbox>}
  </td>
  <td className="px-6 py-4">
      {p.song.album}
  </td>
  <td className="px-6 py-4">
    <button type="button" onClick={() => p.setPreview(p.song.songId)}
      className="flex flex-row text-white bg-gradient-to-br from-purple-600 to-oslyn-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-oslyn-300 dark:focus:ring-oslyn-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
    >
      Preview <ArrowRightOnRectangleIcon className="ml-2 w-4 h-4" />
    </button>
  </td>
</>
}