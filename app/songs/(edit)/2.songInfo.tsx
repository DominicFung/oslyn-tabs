"use client"
import { TrashIcon, ArrowsUpDownIcon, SparklesIcon } from '@heroicons/react/24/solid'

import { Fragment, useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Listbox, Transition } from '@headlessui/react'
import { Song } from '@/src/API'
import Image from 'next/image'

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
  
  const [ albumOpen, setAlbumOpen ] = useState(false)
  const [ albumLink, setAlbumLink ] = useState("")

  return <>
  <div className='mx-auto max-w-4xl cursor-pointer'>
    <div className='flex flex-row'>
      <div className='flex flex-col'>
        <div className='mx-4'>
          <ul className="hidden text-sm font-medium text-center text-gray-500 divide-x divide-gray-200 rounded-lg shadow sm:flex dark:divide-gray-700 dark:text-gray-400">
            <li className="w-full">
                <span className="inline-block w-full p-4 text-gray-900 bg-gray-100 rounded-l-lg focus:ring-4 focus:ring-blue-300 active focus:outline-none dark:bg-gray-700 dark:text-white" aria-current="page">Album</span>
            </li>
            <li className="w-full hover:cursor-pointer" onClick={() => setAlbumOpen(true)}>
                <span className="inline-block w-full p-4 bg-white rounded-r-lg hover:text-gray-700 hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">Link</span>
            </li>
          </ul>
        </div>

        <div {...getRootProps()}>
          <input {...getInputProps()} />
          { isDragActive ?
              <p>Drop the files here ...</p> :
              <div className='block w-48 h-48 m-4 rounded-lg border bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500'>
                { p.song.albumCover ? <Image src={p.song.albumCover} alt={''} width={192} height={192} 
                    className='w-48 h-48 rounded-lg border focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500' />:
                  <span><SparklesIcon className='h-12 w-12 mx-auto mt-20' /></span>
                }
              </div>
          }
        </div>
      </div>
      <div className='flex-1 mt-20'>
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

  <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${albumOpen?"":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-full max-h-full bg-gray-900/75`}>
    <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
      <div className='flex-1' />
      <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
        <button type="button" className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal"
          onClick={() => setAlbumOpen(false)}
        >
            <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            <span className="sr-only">Close modal</span>
        </button>
        <div className="px-6 py-6 lg:px-8">
            <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Album Art Link</h3>
            <span className="space-y-6">
                <div>
                    <label htmlFor="link" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Link</label>
                    <input type="text" name="link" id="link" value={albumLink} onChange={ e => setAlbumLink(e.currentTarget.value) }
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" placeholder="https://" 
                      required />
                </div>
                
                <button onClick={() => { p.song.albumCover = albumLink; p.setSong({ ...p.song }); setAlbumOpen(false) }}
                  className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Save</button>
                <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                    How do I get a link? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Instructions</a>
                </div>
            </span>
          </div>
      </div>
      <div className='flex-1' />
    </div>
  </div>
</>
}