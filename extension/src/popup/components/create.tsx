import React, { useState, useEffect } from "react"
import { Session, SongRequest } from '../types'

import { Listbox, Transition } from '@headlessui/react'
import { ArrowsUpDownIcon } from '@heroicons/react/24/solid'

interface CreateProps {
  session: Session
}

const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']

export default function CreateSong(p: CreateProps) {

  const [ loading, setLoading ] = useState(false)

  // song
  const [ song, setSong ] = useState<SongRequest>({ title: "", chordSheet: "", chordSheetKey: "C", artist: "" })

  useEffect(() => {
    
  }, [])

  const createSong = async () => {
    console.log("createSong")
    setLoading(true)

    const tabs = await chrome.tabs.query({active: true, currentWindow: true})
    console.log(tabs)

    const tabId = tabs[0].id

    if (!tabId) { return }
    chrome.tabs.sendMessage(
      tabId, { action: 'READ_SHEET' },
      (s: { chordsheet: string, title: string, artist: string }) => {
        console.log(s)
        if (s) { setSong({
          title: s.title,
          chordSheet: s.chordsheet,
          chordSheetKey: "C",
          artist: s.artist
        }) }

      }
    )
  }


  return <>
  <div className="relative max-w-md max-h-full mx-auto flex flex-col">
    <div className='flex-1' />
    <div className="relative bg-white shadow dark:bg-gray-700">
      <button type="button" onClick={() => { window.close() } }
          className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal">
        <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
        <span className="sr-only">Close modal</span>
      </button>
      <div className="px-6 py-6 lg:px-8">
          <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Oslyn Extension</h3>
          <p className="mb-6 text-sm font-normal dark:text-gray-400">Click Create to add this song to your account</p>

          <div className="flex flex-row mb-4">
            <div className='flex-1 mr-2'>
              <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
                value={song.title}  placeholder="Title" onChange={(e) => setSong({ ...song, title: e.currentTarget.value })}/>
            </div>
            <div className='flex-1 mr-2'>
              <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
                value={song.artist || ""}  placeholder="Artist" onChange={(e) => setSong({ ...song, artist: e.currentTarget.value })}/>
            </div>
            <div className='flex-0'>
              <Listbox as="div" value={song.chordSheetKey} onChange={(e) => setSong({...song, chordSheetKey: e})} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500">
              {({ open }) => (
                <>
                <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
                  <span className="p-1 px-4 text-sm truncate">{song.chordSheetKey}</span>
                  <span className="absolute flex items-center ml-3 pointer-events-none right-1">
                  <ArrowsUpDownIcon
                    className={`"w-4 h-4 ${open ? "text-oslyn-500" : "text-gray-400"}`}
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
          </div>

            <code className="block w-full mb-4 text-xs space-x-4 bg-gray-800 text-white rounded-lg p-4 pl-6">
              <pre style={{ fontFamily: `"Roboto Mono", "Courier New", monospace;`}}>
              {song.chordSheet.split("\n").map(str => <p className="min-h-[1.5em]">{str}</p>)}
              </pre>
            </code>

          <span className="space-y-2">
            <button onClick={createSong}
                className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-1 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
                  <div className='flex-1' />
                  <div className="px-10 py-2.5" >Copy</div>
                  <div className='flex-1' />
            </button>

            <div className="pt-4 text-sm font-medium text-gray-500 dark:text-gray-300">
                How does this work? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Instructions</a>
            </div>

          </span>
      </div>
    </div>
    <div className='flex-1' />
  </div>
</>
}