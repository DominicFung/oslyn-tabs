"use client"
import { PhotoIcon, BoltIcon, ArrowsUpDownIcon } from '@heroicons/react/24/solid'
import { Listbox, Transition } from '@headlessui/react'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

import { Band } from '@/../src/API'
import Image from 'next/image'
import { sleep } from '@/core/utils/frontend'

interface BandProps {
  standalone?: boolean
  band: Band
  setBand: (b: Band) => void
}

const INSTRUCTION = "Band cover art with the following description."
const POLICY = [ "PRIVATE", "PUBLIC_VIEW", "PUBLIC_JOIN" ]

export default function BandInfo(p: BandProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    console.log(acceptedFiles)

    let files = acceptedFiles.map(file => Object.assign(file, {
      preview: URL.createObjectURL(file)
    }))

    console.log(files)

    p.setBand({ ...p.band, imageUrl: URL.createObjectURL(acceptedFiles[0]) })
  }, [])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {'image/*': []}, onDrop
  })

  const [ bandOpen, setBandOpen ] = useState(false)
  const [ bandLink, setBandLink ] = useState("")

  const generateBandImage = async () => {
    if (!p.band.description) { console.error("description needs to be filled."); return }

    const stableDiffusionId = (await (await fetch(`/api/band/generate`, {
      method: 'POST', 
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ input: { prompt: `${INSTRUCTION} ${p.band.description}` } })
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
      p.setBand({ ...p.band, imageUrl: status })
    } else console.error(`exit with status: ${status}`)
  }

  const check = async (stableDiffusionId: string): Promise<string> => {
    let url = `/api/band/generate/${stableDiffusionId}`
    return (await (await fetch(url)).json() as {output: string}).output
  }

  return <>
    <div className={p.standalone ? 'mx-auto max-w-4xl' : ''}>
      <div className='flex flex-row'>
        <div className='flex flex-col'>
          <div className='mx-4'>
            <ul className="hidden text-sm font-medium text-center text-gray-500 divide-x divide-gray-200 rounded-lg shadow sm:flex dark:divide-gray-700 dark:text-gray-400">
              <li className="w-full">
                  <span className="inline-block w-full p-4 text-gray-900 bg-gray-100 rounded-l-lg focus:ring-4 focus:ring-oslyn-300 active focus:outline-none dark:bg-gray-700 dark:text-white" aria-current="page">Band</span>
              </li>
              <li className="w-full hover:cursor-pointer" onClick={() => setBandOpen(true)}>
                  <span className="inline-block w-full p-4 bg-white rounded-r-lg hover:text-gray-700 hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-oslyn-300 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700">Link</span>
              </li>
            </ul>
          </div>

          <div {...getRootProps()}>
            <input {...getInputProps()} />
            { isDragActive ?
                <p>Drop the files here ...</p> :
                <div className='block w-48 h-48 m-4 rounded-lg border bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500'>
                  { p.band.imageUrl ? <Image src={p.band.imageUrl} alt={''} width={192} height={192} 
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
                value={p.band.name}  placeholder="Band Name" onChange={(e) => p.setBand({ ...p.band, name: e.currentTarget.value })}/>
            </div>
            
          </div>
          <div className="relative w-full mt-2">
            <textarea rows={4} id="search" className="block w-full p-4 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500" 
              value={p.band.description || ""}  placeholder="Description ..." onChange={(e) => p.setBand({ ...p.band, description: e.currentTarget.value })}/>
            <button type="submit" onClick={generateBandImage}
              className="hidden sm:block text-white absolute right-2.5 bottom-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800"
            >
              <BoltIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      <div className='ml-5 flex-0'>
        <Listbox as="div" value={p.band.policy || "PRIVATE"} onChange={(e) => { p.setBand({ ...p.band, policy: e })}} className="relative p-1 py-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-oslyn-500 focus:border-oslyn-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-gray-400 dark:focus:ring-oslyn-500 dark:focus:border-oslyn-500">
        {({ open }) => (
          <>
          <Listbox.Button className="relative w-full min-w-0 inline-flex items-center appearance-none focus:outline-none h-9 px-3 py-0 text-sm rounded-base pr-6 cursor-base shadow-sm text-neutral-900 dark:text-neutral-100 dark:bg-base dark:hover:border-neutral-600">
            <span className="p-1 px-4 text-sm truncate">
              {p.band.policy || "PRIVATE" }
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
              className="absolute left-0 z-40 max-h-64 w-full mt-2 origin-top-left rounded-base shadow-sm outline-none overflow-auto border border-gray-200 dark:bg-neutral-800 dark:border-gray-700 py-1.5 px-1.5 space-y-1"
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

    <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${bandOpen?"":"hidden"} fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] max-h-full bg-gray-900/75`}>
      <div className="relative w-full h-full max-w-md max-h-full mx-auto flex flex-col">
        <div className='flex-1' />
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <button type="button" onClick={() => setBandOpen(false)}
            className="absolute top-3 right-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center dark:hover:bg-gray-800 dark:hover:text-white" data-modal-hide="authentication-modal"
          >
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
              <span className="sr-only">Close modal</span>
          </button>
          <div className="px-6 py-6 lg:px-8">
              <h3 className="mb-4 text-xl font-medium text-gray-900 dark:text-white">Band Art Link</h3>
              <span className="space-y-6">
                  <div>
                      <label htmlFor="link" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Link</label>
                      <input type="text" name="link" id="link" value={bandLink} onChange={ e => setBandLink(e.currentTarget.value) }
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-oslyn-500 focus:border-oslyn-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white" placeholder="https://" 
                        required />
                  </div>
                  
                  <button onClick={() => { p.band.imageUrl = bandLink; p.setBand({ ...p.band }); setBandOpen(false) }}
                    className="w-full text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">Save</button>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-300">
                      How do I get a link? <a href="#" className="text-oslyn-700 hover:underline dark:text-oslyn-500">Instructions</a>
                  </div>
              </span>
            </div>
        </div>
        <div className='flex-1' />
      </div>
    </div>
  </>
}