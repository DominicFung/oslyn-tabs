"use client"
import { TrashIcon, ArrowsUpDownIcon, SparklesIcon } from '@heroicons/react/24/solid'

import { Fragment, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Listbox, Transition } from '@headlessui/react'
import { Song } from '@/src/API'

interface SongProps {
  song: Song,
  setSong: (s: Song) => void
}

const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']

export default function Song(p: SongProps) {
  const onDrop = useCallback((acceptedFiles: any) => {
    console.log(acceptedFiles)
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({onDrop})

  return <div className='mx-auto max-w-4xl cursor-pointer'>
    <div className='flex flex-row'>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        {
          isDragActive ?
            <p>Drop the files here ...</p> :
            <div className='block w-48 h-48 m-4 rounded-lg border bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500'>
              <span>
                <SparklesIcon className='h-12 w-12 mx-auto mt-20' />
              </span>
            </div>
        }
      </div>
      <div className='flex-1 mt-5'>
        <div className="flex flex-row">
          <div className='flex-1 mr-2'>
            <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500" 
              value={p.song.title}  placeholder="Title" onChange={(e) => p.setSong({ ...p.song, title: e.currentTarget.value })}/>
          </div>
          <div className='flex-0'>
            <Listbox as="div" value={p.song.chordSheetKey} onChange={(e) => p.setSong({...p.song, chordSheetKey: e})} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
            {({ open }) => (
              <>
              <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
                <span className="p-1 px-4 text-sm truncate">{p.song.chordSheetKey}</span>
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
                            ${selected && "bg-blue-50 text-blue-800 dark:bg-blue-200 dark:bg-opacity-15 dark:text-blue-200"}`}
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
        <div className="relative w-full mt-2">
          <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500" 
            value={p.song.artist || ""}  placeholder="Artist" onChange={(e) => p.setSong({ ...p.song, artist: e.currentTarget.value })}/>
          <button type="submit" onClick={() => { }}
            className="hidden sm:block text-white absolute right-2.5 bottom-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            <TrashIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="relative w-full mt-2">
          <input className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500" 
            value={p.song.album || ""}  placeholder="Album" onChange={(e) => p.setSong({ ...p.song, album: e.currentTarget.value })}/>
          <button type="submit" onClick={() => { }}
            className="hidden sm:block text-white absolute right-2.5 bottom-2 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            <TrashIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
      
  </div>
}