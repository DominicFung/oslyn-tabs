"use client"

import { Band, Song } from "@/../src/API"

import { ArrowsUpDownIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'
import { useState } from "react"

import Image from "next/image"
import { ShareBandRequest } from "@/app/api/share/song/route"

interface BandProps {
  song: Song
  bands: Band[]

  setClose: () => void
}

export default function Bands(p: BandProps) {

  const [ bandIndex, setBandIndex ] = useState(0)

  const share = async () => {
    if (!p.song.songId) { console.error("songId should be available"); return }
    if (!p.bands[bandIndex].bandId) { console.error("bandId should be available"); return }

    console.log(`${p.song.title} ==> ${p.bands[bandIndex].name}`)

    const data = await (await fetch(`/api/share/song`, {
      method: "POST",
      body: JSON.stringify({
        songId: p.song.songId, bandId: p.bands[bandIndex].bandId
      } as ShareBandRequest)
    })).json() as Band

    console.log(data)
    p.setClose()
  }

  return <>
    <div className="px-6 py-6 lg:px-8">
      <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Share</h3>
      <span className="space-y-6">
      { p.bands.length > 0 && <span>
        Choose a band that you are a part of
      </span> }

        { p.bands.length > 0 && <div className='flex-1 w-64'>
          <Listbox as="div" value={bandIndex} onChange={(e) => { setBandIndex(e)}} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-blue-500 dark:focus:border-blue-500">
          {({ open }) => (
            <>
            <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
              <div className="p-1 px-4 text-sm truncate flex flex-row">
                <Image className="mr-4" src={p.bands[bandIndex].imageUrl || ""} alt="" width={28} height={28}/>
                <span className="pt-1.5" >{p.bands[bandIndex].name}</span>
              </div>
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
                {p.bands.map((b, i) => (
                  <Listbox.Option
                    className="relative"
                    key={i}
                    value={i}
                  >
                    {({ active, selected, disabled }) => (
                      <button
                        disabled={disabled}
                        aria-disabled={disabled}
                        className={`flex items-center w-full px-4 pl-4 h-9 border-0 flex-shrink-0 text-sm text-left cursor-base font-normal focus:outline-none rounded-base
                          ${active && "bg-neutral-100 dark:bg-neutral-700"}
                          ${selected && "bg-oslyn-100 text-oslyn-800 dark:bg-oslyn-600 dark:bg-opacity-15 dark:text-oslyn-100"}`}
                      >
                        <div className={`flex-1 block truncate ${selected ? "font-semibold" : "font-normal"}`}>
                          <div className="p-1 px-4 text-sm truncate flex flex-row">
                            <Image className="mr-4" src={b.imageUrl || ""} alt="" width={28} height={28}/>
                            <span className="pt-1.5" >{b.name}</span>
                          </div>
                        </div>
                      </button>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
            
            </>
          )}
          </Listbox>
        </div>}

        {p.bands.length === 0 && <div>
          <span>Opps! you dont belong to any bands.</span>
        </div>}

        <button onClick={share}
          className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">Share</button>
        <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
            How do I get a link? <a href="#" className="text-blue-700 hover:underline dark:text-blue-500">Instructions</a>
        </div>


      </span>
    </div>
  </>
}