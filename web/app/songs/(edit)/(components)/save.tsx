"use client"

import { SongUpdateRequest } from "@/app/api/song/[id]/update/route"
import { SongRequest } from "@/app/api/song/create/route"
import { getArrayBufferFromObjectURL } from "@/core/utils/frontend"
import { Song } from "@/../src/API"
import { InboxArrowDownIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"
import { useRef, useState, Fragment } from "react"
import { Popover, Transition } from "@headlessui/react"
import { usePopper } from 'react-popper'

export interface SaveProps {
  song: Song,
  type: "create" | "update",
  shareWithBand?: string,

  goToReviewTab?: () => void
  loading?: boolean
}

export default function Save(p: SaveProps) {
  const router = useRouter()

  const buttonRef = useRef<any>(null)
  let [referenceElement, setReferenceElement] = useState<any>()
  let [popperElement, setPopperElement] = useState<any>()
  let { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: "left"
  })
  const timeoutDuration = 500
  let timeout: any

  let [isLoading, setIsLoading] = useState(false)

  const closePopover = () => {
    return buttonRef.current?.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true
      })
    )
  }

  const onMouseEnter = (open:boolean) => {
    clearTimeout(timeout)
    if (open) return

    console.log(buttonRef.current)
    return buttonRef.current?.click()
  }

  const onMouseLeave = (open:boolean) => {
    if (!open) return
    timeout = setTimeout(() => closePopover(), timeoutDuration)
  }

  const updateSong = async () => {
    if (!p.song.songId) { console.error("songId not available"); return }
    setIsLoading(true)

    const data = await (await fetch(`/api/song/${p.song?.songId}/update`, {
      method: "POST",
      body: JSON.stringify({...p.song} as SongUpdateRequest)
    })).json() as Song
    console.log(data)
    router.push(`/songs`)
  }

  const createSong = async () => {
    if (!p.song.title || !p.song.chordSheetKey) { console.error("title and key not available"); return }
    setIsLoading(true)

    let songRequest = {
      title: p.song.title, chordSheetKey: p.song.chordSheetKey,
      artist: p.song.artist, album: p.song.album, 
      albumCover: p.song.albumCover, chordSheet: p.song.chordSheet,
    } as SongRequest

    if (p.shareWithBand) songRequest.shareWithBand = p.shareWithBand

    if (p.song.albumCover?.startsWith("blob")) {
      let img = await getArrayBufferFromObjectURL(p.song.albumCover)
      console.log(songRequest.albumCover)
      console.log(img)

      if (img) {
        delete songRequest.albumCover
        songRequest.arrayBuffer = new Uint8Array(img as ArrayBuffer)
      }
    }

    const data = await (await fetch(`/api/song/create`, {
      method: "POST",
      body: JSON.stringify(songRequest)
    })).json() as Song
    console.log(data)
    router.push(`/songs`)
  }

  return <>
  {/* saveMenu && <div id="toast-bottom-right" className="fixed flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-5 bottom-5 dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800" role="alert">
        <div className="text-sm font-normal">
          <div className="flex">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-oslyn-500 bg-oslyn-100 rounded-lg dark:text-oslyn-300 dark:bg-oslyn-900">
              <InboxArrowDownIcon className="w-5 h-5" />
            </div>
            <div className="ml-3 text-sm font-normal">
              <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">All Done?</span>
              <div className="mb-2 text-sm font-normal">Review the experience now!</div> 
              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <button disabled={p.song.chordSheet === "" || p.song.title === "" || p.song.chordSheetKey === "" } onClick={p.type === "create" ? createSong : updateSong}
                        className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-white bg-oslyn-600 rounded-lg hover:bg-oslyn-700 focus:ring-4 focus:outline-none focus:ring-oslyn-300 dark:bg-oslyn-500 dark:hover:bg-oslyn-600 dark:focus:ring-oslyn-800 disabled:bg-gray-600">
                          Submit
                      </button>
                  </div>
                  <div>
                      <button onClick={() => {if (p.goToReviewTab) p.goToReviewTab()}}
                        className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">
                          Review
                      </button> 
                  </div>
              </div>    
            </div>
            <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close"
              onClick={() => setSaveMenu(false)}
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
    </div> */}
    {<div className="fixed z-90 bottom-20 right-20">
      <Popover className="relative">
        {({ open }) => {
          return <>
            <div onMouseLeave={onMouseLeave.bind(null, open)}>
              <button
                className="absolute disabled:text-gray-600 text-oslyn-800 hover:text-oslyn-900 disabled:bg-gray-400 bg-coral-400 w-16 h-16 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl"
                disabled={
                  p.song.title === "" || p.song.albumCover === "" || p.song.artist === "" || 
                  p.song.album === "" || p.song.chordSheet === "" || p.song.albumCover === "" ||
                  p.loading || isLoading }
              >
                <InboxArrowDownIcon className={`w-8 h-8 ${(p.loading || isLoading ) && "text-gray-500"}`} />
                { (p.loading || isLoading ) && <div className="absolute pb-1">
                  <svg aria-hidden="true" className="inline w-9 h-9 text-gray-200 animate-spin dark:text-oslyn-50 fill-oslyn-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                      <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                  </svg>
                  <span className="sr-only">Loading...</span>
                </div> }
              </button>
              <Popover.Button onMouseUp={() => { 
                  console.log("MouseUp!"); if (!p.loading) { p.type === "create" ? createSong() : updateSong() }
                }} ref={buttonRef} 
                disabled={p.song.chordSheet === "" || p.song.title === "" || p.song.chordSheetKey === "" }
                onMouseEnter={onMouseEnter.bind(null, open)}
                onMouseLeave={onMouseLeave.bind(null, open)}
                className={`absolute ${(p.loading || isLoading) && 'cursor-default'}`}
              >
                <div className="w-16 h-16" ref={setReferenceElement} />
              </Popover.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Popover.Panel /*className="absolute z-10 w-screen max-w-sm px-4 mt-0 sm:px-0 lg:max-w-3xl"*/
                ref={setPopperElement}
                style={styles.popper}
                {...attributes.popper}
              >
                <div
                  className="overflow-hidden rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white text-gray-700 dark:text-gray-100 mx-2"
                  onMouseEnter={onMouseEnter.bind(null, open)}
                  onMouseLeave={onMouseLeave.bind(null, open)}
                >
                  { p.loading && <p className="w-48">Please wait as we clean up your chordsheet using ChatGPT</p>}
                  { !p.loading && <p className="m-2">Save!</p> }
                </div>
              </Popover.Panel>
            </Transition>
          </>
        }}
      </Popover>
    </div>}
  </>

}