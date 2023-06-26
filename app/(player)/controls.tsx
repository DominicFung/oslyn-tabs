"use client"

import { Cog6ToothIcon } from "@heroicons/react/24/solid"
import { useEffect, useState } from "react"
import Capo from "./(controls)/capo"
import { JamSong } from "@/src/API"
import Song from "./(controls)/song"
import Key from "./(controls)/key"
import Display from "./(controls)/display"

export interface ControlsProp {
  capo?: {
    capo: string
    setCapo: (capo: string) => void
  }
  song?: {
    song: number
    setSong: (n: number) => void
    songs: JamSong[]
  }
  sKey?: {
    skey: string
    setKey: (s: string) => void
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
  
  pt?: boolean | undefined
}

export default function Controls(p: ControlsProp) {
  const [ open, setOepn ] = useState(false)

  const [ options, setOptions ] = useState([
    { name: "Song", disabled: false },
    { name: "Key", disabled: false },
    { name: "Capo", disabled: false },
    { name: "Text", disabled: false }
  ])

  useEffect(() => {
    setOptions([
      { name: "Song", disabled: !p.song || !p.song.songs || !p.song.setSong },
      { name: "Key", disabled: !p.sKey || !p.sKey.skey || !p.sKey.setKey },
      { name:"Capo", disabled: !p.capo || !p.capo.capo || !p.capo.setCapo },
      { name: "Display", disabled: !p.display || !p.display.textSize || !p.display.setTextSize || !p.display.setAuto || !p.display.setComplex }
    ])
  }, [p])

  const [ option, setOption ] = useState(0)

  return <>
    { open && <div id="toast-bottom-right" 
    className={`fixed max-w-lg max-h-[calc(100vh-2rem)] flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-10 ${p.pt?"top-32":"top-4"} dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800`} role="alert">
        <div className="text-sm font-normal">
          <div className="flex">
            <div className="flex-shrink-0 flex flex-col space-y-2 mr-4">
              {options.map((o, i) => 
                <button key={i} disabled={o.disabled} onClick={() => setOption(i)}
                  className={`px-4 py-2 shadow-md text-oslyn-500 bg-oslyn-100 rounded-md ${option === i ? "dark:text-white dark:bg-oslyn-800" : "dark:text-oslyn-300 dark:bg-oslyn-900"} dark:disabled:text-gray-400 dark:disabled:bg-gray-600`}>
                  {o.name}
                </button>
              )}
            </div>
            <>
              { option === 0 && <Song song={p.song!.song} setSong={p.song!.setSong} songs={p.song!.songs}  /> }
              { option === 1 && <Key skey={p.sKey!.skey} setKey={p.sKey!.setKey} /> }
              { option === 2 && <Capo capo={p.capo!.capo} setCapo={p.capo!.setCapo} />}
              { option === 3 && <Display textSize={p.display!.textSize} setTextSize={p.display!.setTextSize} 
                                    auto={p.display!.auto} setAuto={p.display!.setAuto} 
                                    complex={p.display!.complex} setComplex={p.display!.setComplex}
                                    fullScreen={p.display!.fullScreen} setFullScreen={p.display!.setFullScreen}
                                    headsUp={p.display!.headsUp} setHeadsUp={p.display!.setHeadsUp}
                                /> }
            </>
            <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close"
              onClick={() => setOepn(false)}
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
    </div> }
    { !open && <button onClick={() => setOepn(true)}
      className={`fixed z-90 right-10 ${p.pt ?"top-32":"top-4"} bg-coral-400 w-12 h-12 rounded-lg p-2 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl`}
    >
      <Cog6ToothIcon className="w-8 h-8 text-oslyn-800 hover:text-oslyn-900" />
    </button>}
  </>
}