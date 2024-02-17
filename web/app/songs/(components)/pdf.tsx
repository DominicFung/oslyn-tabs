"use client"

import { ArrowsUpDownIcon, EyeIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'

import { Song } from "@/../src/API"
import { save, createSheet } from "@/core/pdf"
import { useState } from "react"

interface DownloadPdfProps {
  open: boolean
  setOpen: (b: boolean) => void

  song: Song
}

const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']

export default function DownloadPdf(p: DownloadPdfProps) {

  const [ key, setKey ] = useState(p.song.chordSheetKey || "C")

  const downloadSheet = async (song: Song, key: string) => {
    console.log("downloading sheet ...")
    let pdf =  await createSheet(song, key)
    let uri = await save(pdf)

    const link = document.createElement("a")
    link.download = `${song.title}.pdf`
    link.href = uri
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return <>
  <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${p.open?"":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(110%)] max-h-full bg-gray-900/75`}>
    <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
      <div className='flex-1' />
      <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <button type="button" onClick={() => p.setOpen(false)}
            className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal">
          <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
          <span className="sr-only">Close modal</span>
        </button>
        <div className="px-6 py-6 lg:px-8">
            <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Download</h3>
            <p className="mb-6 text-sm font-normal dark:text-gray-400">Convert your song to PDF. Free. Plase select the key.</p>
            <div className='flex-0'>
              <Listbox as="div" value={key} onChange={(e) => { setKey(e) }} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
              {({ open }) => (
                <>
                <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
                  <span className="p-1 px-4 text-sm truncate">{key}</span>
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

            <button onClick={() => downloadSheet(p.song, key) }
              className="mt-5 w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
                <div className='flex-1' />
                <div className="px-10 py-2.5" >Download</div>
                <div className='flex-1' />
            </button>

          </div>
        </div>
        <div className='flex-1' />
      </div>
    </div>
  </>
}