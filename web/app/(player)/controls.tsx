"use client"

import { Cog6ToothIcon } from "@heroicons/react/24/solid"
import { useEffect, useState } from "react"
import Capo from "./(controls)/capo"
import { JamSong, Participant } from "@/../src/API"
import Song from "./(controls)/song"
import Key from "./(controls)/key"
import Display from "./(controls)/display"
import QrCode from "./(controls)/qrcode"
import Slides from "./(controls)/slides"
import Users from "./(controls)/users"
import Queue from "./(controls)/queue"

export interface ControlsProp {
  jamSessionId: string
  open: boolean
  setOpen: (b: boolean) => void
  capo?: {
    capo: string
    setCapo: (capo: string) => void
  }
  song?: {
    song: number
    setSong: (n: number) => void
    addToQueue?: (songId: string) => void
    songs: JamSong[]
  }
  sKey?: {
    skey: string
    setKey: (s: string) => void
    togglePreview?: () => void
  }
  display?: {
    textSize: string
    setTextSize:  (s: string) => void
    auto: boolean
    setAuto: (b: boolean) => void
    complex: boolean
    setComplex: (b: boolean) => void
    fullScreen: boolean
    setFullScreen: (b: boolean) => void
    headsUp: boolean
    setHeadsUp: (b: boolean) => void
  }

  slides?: {
    textSize: string
    setTextSize:  (s: string) => void
  }

  users?: {
    active: Participant[]
    removeActive: (s: string) => void
  }

  queue?: {
    songs: JamSong[]
    queueOrder: (number|null)[] 
    removeFromQueue: (index: number) => void
  }
  
  qrCode?: boolean
  pt?: boolean | undefined
}

export default function Controls(p: ControlsProp) {
  const [ options, setOptions ] = useState([
    { name: "Song", disabled: false },
    { name: "Key", disabled: false },
    { name: "Capo", disabled: false },
    { name: "Text", disabled: false },
    { name: "QR", disabled: false },
    { name: "Slides", disabled: false },
    { name: "Users", disabled: false },
    { name: "Queue", disabled: false }
  ])

  useEffect(() => {
    const ops = [
      { name: "Song", disabled: !p.song || !p.song.songs || !p.song.setSong },
      { name: "Key", disabled: !p.sKey || !p.sKey.skey || !p.sKey.setKey },
      { name:"Capo", disabled: !p.capo || !p.capo.capo || !p.capo.setCapo },
      { name: "Display", disabled: !p.display || !p.display.textSize || !p.display.setTextSize || !p.display.setAuto || !p.display.setComplex },
      { name: "QR", disabled: p.qrCode ? false : true },
      { name: "Slides", disabled: p.users ? false : true },
      { name: "Users", disabled: !p.users },
      { name: "Queue", disabled: !p.queue || !p.queue.songs || !p.queue.removeFromQueue }
    ]
    setOptions(ops)

    // if option is disabled, we want to choose a new option
    if (ops[option].disabled) {
      for (let i=option; i<ops.length; i++) {
        if (!ops[i].disabled) { setOption(i); return }
      }

      // if you make it here, it means everything in front was disabled, lets try backwards
      for (let i=option; i>=0; i--) {
        if (!ops[i].disabled) { setOption(i); return }
      }
    }
  }, [p])

  const [ option, setOption ] = useState(0)

  return <>
      <div id="authentication-modal" tabIndex={-1} aria-hidden="true" className={`${p.open?"":"hidden"} fixed top-0 left-0 right-0 z-40 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-full max-h-full bg-gray-900/75`} 
        onClick={() => { p.setOpen(false) }} />
      { p.open && <div id="toast-bottom-right" className={`z-50 fixed ${option===0?"md:max-w-4xl w-full":"sm:max-w-lg w-full"} max-h-[calc(100vh-2rem)] flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-0 sm:right-10 ${p.pt?"top-32":"top-4"} dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800`} role="alert">
        <div className="text-sm font-normal w-full">
          <div className="flex flex-col sm:flex-row w-full">
            <div className="flex-shrink-0 sm:flex hidden flex-col space-y-2 mr-4">
              {options.map((o, i) => 
                o.disabled ? <></> : <button key={i} disabled={o.disabled} onClick={() => setOption(i)}
                  className={`px-4 py-2 shadow-md text-oslyn-500 bg-oslyn-100 rounded-md ${option === i ? "dark:text-white dark:bg-oslyn-800" : "dark:text-oslyn-300 dark:bg-oslyn-900"} dark:disabled:text-gray-400 dark:disabled:bg-gray-600`}>
                  {o.name}
                </button>
              )}
            </div>
            <div className="max-w-[calc(100vw-2rem)] flex-row sm:hidden text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700 mb-5">
              <ul className="flex -mb-px overflow-x-scroll">
              {options.map((o, i) => 
                <li key={i} className="mr-2">
                  <button disabled={o.disabled} onClick={() => setOption(i)}
                    className={`inline-block p-4 border-b-2 ${option === i ? "text-oslyn-600 border-b-2 border-oslyn-600":"border-transparent"} rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`}>{o.name}</button>
                </li>
              )}
              </ul>
            </div>

            <>
              { option === 0 && p.song && <Song jamSessionId={p.jamSessionId} song={p.song!.song} setSong={(n) => {p.song!.setSong(n); p.setOpen(false)}} songs={p.song!.songs} addToQueue={p.song.addToQueue}  /> }
              { option === 1 && p.sKey && <Key skey={p.sKey!.skey} setKey={p.sKey!.setKey} togglePreview={p.sKey.togglePreview} /> }
              { option === 2 && p.capo && <Capo capo={p.capo!.capo} setCapo={p.capo!.setCapo} />}
              { option === 3 && p.display && <Display textSize={p.display!.textSize} setTextSize={p.display!.setTextSize} 
                                    auto={p.display!.auto} setAuto={p.display!.setAuto} 
                                    complex={p.display!.complex} setComplex={p.display!.setComplex}
                                    fullScreen={p.display!.fullScreen} setFullScreen={p.display!.setFullScreen}
                                    headsUp={p.display!.headsUp} setHeadsUp={p.display!.setHeadsUp}
                                /> }
              { option === 4 && p.qrCode && <QrCode /> }
              { option === 5 && p.slides && <Slides textSize={p.slides!.textSize} setTextSize={p.slides!.setTextSize}  /> }
              { option === 6 && p.users && <Users users={p.users!.active} removeUser={p.users!.removeActive} /> }
              { option === 7 && p.queue && <Queue songs={p.queue.songs} queue={p.queue.queueOrder} removeFromQueue={p.queue.removeFromQueue}/> }
            </>
            <button type="button" className="hidden sm:inline-block fixed right-12 top-7 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-0 sm:p-1.5 hover:bg-gray-100 h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close"
              onClick={() => p.setOpen(false)}
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
      </div> }
    { !p.open && <button onClick={() => p.setOpen(true)}
      className={`fixed z-90 right-2 sm:right-10 ${p.pt ?"top-32":"top-4"} bg-coral-400 w-12 h-12 rounded-lg p-2 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl`}
    >
      <Cog6ToothIcon className="w-8 h-8 text-oslyn-800 hover:text-oslyn-900" />
    </button>}
  </>
}