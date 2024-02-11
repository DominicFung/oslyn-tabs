"use client"
import { PhotoIcon, BoltIcon, ArrowsUpDownIcon, ArrowDownTrayIcon } from '@heroicons/react/24/solid'
import { Listbox, Transition } from '@headlessui/react'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Band } from '@/../src/API'
import Image from 'next/image'
import { sleep } from '@/core/utils/frontend'

interface BandProps {
  standalone?: boolean
  band: Band
  setBand?: (b: Band) => void
}

const INSTRUCTION = "Band cover art with the following description."
const POLICY = [ "PRIVATE", "PUBLIC_VIEW", "PUBLIC_JOIN" ]

export default function BandInfo(p: BandProps) {
  const [band, _setBand] = useState(p.band)
  const setBand = (b: Band) => { if (p.setBand) p.setBand(b); else _setBand(b) }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles)

    let files = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))

    console.log(files)

    setBand({ ...band, imageUrl: URL.createObjectURL(acceptedFiles[0]) })
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {'image/*': []}, onDrop
  })

  const generateBandImage = async () => {
    if (!band.description) { console.error("description needs to be filled."); return }

    const stableDiffusionId = (await (await fetch(`/api/band/generate`, {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ input: { prompt: `${INSTRUCTION} ${band.description}` } })
    })).json() as { id: string }).id

    console.log(`stable diffusion: ${stableDiffusionId}`)
    if (!stableDiffusionId) { console.error("no return"); return }
    
    setImage(stableDiffusionId)
  }

  const setImage = async (stableDiffusionId: string) => {
    let status = "processing"
    do {
      await sleep(800)
      status = await check(stableDiffusionId)
      console.log(status)
    } while (status === "processing" || status === "starting")

    if (status.startsWith("https")) {
      setBand({ ...band, imageUrl: status })
    } else console.error(`exit with status: ${status}`)
  }

  const check = async (stableDiffusionId: string): Promise<string> => {
    let url = `/api/band/generate/${stableDiffusionId}`
    return (await (await fetch(url)).json() as {output: string}).output
  }

  return <>
    <div className={p.standalone ? 'mx-auto max-w-4xl' : ''}>
      <div className='flex flex-row'>
        <div className='flex flex-col mt-16'>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            { isDragActive ?
                <div className='block w-48 h-48 m-4 rounded-lg border bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500'>
                  <span><ArrowDownTrayIcon className='h-12 w-12 mx-auto mt-20' /></span>
              </div> :
                <div className='block w-48 h-48 m-4 rounded-lg border bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500'>
                  { band.imageUrl ? <Image src={band.imageUrl} alt={''} width={192} height={192} 
                      className='w-48 h-48 rounded-lg border focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500' />:
                    <span><PhotoIcon className='h-12 w-12 mx-auto mt-20' /></span>
                  }
                </div>
            }
          </div>
        </div>
        <div className='flex-1 mt-20'>
          <div className="flex flex-row">
            <div className='flex-1'>
              <input type="search" id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
                value={band.name}  placeholder="Band Name" onChange={(e) => setBand({ ...band, name: e.currentTarget.value })}/>
            </div>
            
          </div>
          <div className="relative w-full mt-2">
            <textarea rows={4} id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
              value={band.description || ""}  placeholder="Description ..." onChange={(e) => setBand({ ...band, description: e.currentTarget.value })}/>
            <button type="submit" onClick={generateBandImage}
              className="hidden sm:block text-white absolute right-2.5 bottom-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800"
            >
              <BoltIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className='ml-5 flex-0'>
        <Listbox as="div" value={band.policy || "PRIVATE"} onChange={(e) => { setBand({ ...band, policy: e })}} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500">
        {({ open }) => (
          <>
          <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
            <span className="p-1 px-4 text-sm truncate">
              {band.policy || "PRIVATE" }
            </span>
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
              {POLICY.map((policy) => (
                <Listbox.Option
                  className="relative"
                  key={policy}
                  value={policy}
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
                        {policy}
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
  </>
}