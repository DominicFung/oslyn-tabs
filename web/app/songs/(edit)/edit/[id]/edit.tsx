"use client"

import { Song } from "@/../src/API"
import { useState } from "react"
import PasteTabs from "../../pasteTabs"
import SongInfo from "../../songInfo"

import Slides from "@/app/(player)/slides"
import Save from "../../(components)/save"
import Tabs from "../../(components)/tabs"

export interface EditProps {
  song: Song
}

export default function Edit(p: EditProps) {
  const [ step, setStep ] = useState(0)
  const [ song, setSong ] = useState(p.song)

  return <div className="text-white w-full h-screen flex flex-col">
    <div className="flex-0">
      <Tabs step={step} setStep={setStep}  />
    </div>
    
    <div className="flex-1 p-4">
      { step === 0 && <PasteTabs tabs={song.chordSheet || ""} setTabs={(t: string) => { console.log(t); setSong({ ...song, chordSheet: t }) }} /> }
      { step === 1 && <SongInfo song={song} setSong={setSong}/>}
      { step === 2 && <Slides song={song} pt={true} /> }
    </div>
    <Save song={song} type="update"/>
  </div>
}