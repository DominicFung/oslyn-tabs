"use client"
import Image from "next/image"
import { JamSong, SetList, Song, User } from "@/src/API"

import { Listbox, Transition } from '@headlessui/react'
import { ArrowsUpDownIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'

import { useEffect, useState, Fragment } from "react"
import Save from "../../(components)/save"
import EditSlides from "../../(components)/editSlides"

export interface CreateSetTableProps {
  songs: Song[]
}

export const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']

export default function CreateSetTable(p: CreateSetTableProps) {

  const [ description, setDescription ] = useState<string>("") 
  const [ keys, setKeys ] = useState<string[]>(Array(p.songs.length).fill("C"))
  const [ sListCheck, setSListCheck ] = useState<boolean[]>(Array(p.songs.length).fill(false)) 
  const [ allCheck, setAllCheck ] = useState<boolean>(false)

  const [ preview, setPreview ] = useState(-1)

  const [ setList, setSetList ] = useState({
    setListId: "",
    description: "",
    songs: [] as JamSong[],
    creator: {} as User, editors: [] as User[],
  } as SetList) 

  useEffect(() => {
    const b = { ...setList, description, songs: [] as JamSong[] } as SetList
    if (sListCheck.length !== keys.length) { console.error("CheckList needs to be the same length as keys."); return }
    if (sListCheck.length !== p.songs.length) { console.error("CheckList needs to be the same length as p.songs."); return }

    for (let i = 0; i < sListCheck.length; i++) {
      if (sListCheck[i]) { b.songs.push({ song: p.songs[i] as Song, key: keys[i] } as JamSong) }
    }

    console.log(b)
    setSetList(b)
  }, [description, sListCheck, keys])

  useEffect(() => {
    let allTrue = true
    let allFalse = true
    for (let i = 0; i < sListCheck.length; i++) { 
      if (sListCheck[i]) allFalse = false
      if (!sListCheck[i]) allTrue = false
    }
    if (allTrue) setAllCheck(true)
    if (allFalse) setAllCheck(false)
  }, [sListCheck])

  useEffect(() => {
    let k = [] as string[]
    for (let i = 0; i < p.songs.length; i++) { 
      k.push(p.songs[i].chordSheetKey || "C")
    }
    setKeys(k)
  }, [])

  return <>
  { preview >= 0 && <>
    { setList.songs[preview] ? <EditSlides song={setList.songs[preview]!} /> : "" }
  </> }
  { preview < 0 && <>
    <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Choose Your Songs</h1>
          <p className="mb-8 text-lg font-normal text-gray-500 lg:text-xl sm:px-16 lg:px-48 dark:text-gray-200">
            Check all the songs that you would like to add to your Set.
          </p>
          <div className="mx-auto max-w-xl">
            <input type="search" id="search" className="mx-auto w-full block p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                value={description}  placeholder="Set Description (ie. May 12 2023 Jam)" onChange={(e) => setDescription(e.target.value)}/>
          </div>
        
      </div>
      <div className="bg-gradient-to-b from-oslyn-50 to-transparent dark:from-oslyn-900 w-full h-full absolute top-0 left-0 z-0"></div>
    </section>
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
                <th scope="col" className="px-6 py-3">
                  <input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 text-oslyn-600 bg-coral-100 border-coral-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
                    checked={allCheck} onChange={() => { setAllCheck(!allCheck); setSListCheck(Array(p.songs.length).fill(!allCheck)) }}
                  />
                </th>
                <th scope="col" className="px-6 py-3">
                    Title
                </th>
                <th scope="col" className="px-6 py-3">
                    Key
                </th>
                <th scope="col" className="px-6 py-3">
                    Album
                </th>
                <th scope="col" className="px-6 py-3">
                    Action
                </th>
            </tr>
        </thead>
        <tbody>
            {p.songs.map((a, i) => <tr key={i} className="bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                <th className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  <input id="default-checkbox" type="checkbox" value="" className="w-4 h-4 text-oslyn-600 bg-coral-100 border-coral-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" 
                    checked={sListCheck[i]} onChange={() => { sListCheck[i] = !sListCheck[i]; setSListCheck([...sListCheck]) }}
                  />
                </th>
                <td className="px-6 py-4">
                  <a href={`/songs/edit/${a.songId}`}>                  
                    <div className="flex flex-row hover:cursor-pointer">
                      {a.albumCover && <Image src={a.albumCover} alt={""} width={40} height={40} className="w-10 m-2"/> }
                      <div className="m-2">
                        <div className="text-white bold">{a.title}</div>
                        <div>{a.artist}</div>
                      </div>
                    </div>
                  </a>
                </td>
                <td className="px-6 py-4">
                    {!sListCheck[i] && a.chordSheetKey}
                    {sListCheck[i] && <Listbox as="div" value={keys[i]} onChange={(e) => { keys[i] = e; setKeys([...keys]) }} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
                      {({ open }) => (
                        <>
                        <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
                          <span className="p-1 px-4 text-sm truncate">{keys[i]}</span>
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
                    </Listbox>}
                </td>
                <td className="px-6 py-4">
                    {a.album}
                </td>
                <td className="px-6 py-4">
                  <button type="button" onClick={() => setPreview(i)} disabled={!sListCheck[i]}
                    className="flex flex-row enabled:text-white text-gray-300 bg-gray-600 enabled:bg-gradient-to-br enabled:from-purple-600 enabled:to-oslyn-500 enabled:hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-oslyn-300 dark:focus:ring-oslyn-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2"
                  >
                    Preview <ArrowRightOnRectangleIcon className="ml-2 w-4 h-4" />
                  </button>
                </td>
            </tr>)}
        </tbody>
      </table>
    </div>
    <Save set={setList} type="create" />
  </> }
</>
} 


