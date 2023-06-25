"use client"
import { useState } from 'react'

import PasteTabs from "../1.pasteTabs"
import SongInfo from '../2.songInfo'
import { Song } from '@/src/API'
import { User } from '@/src/API'
import Slides from '@/app/(player)/slides'
import Save from '../(components)/save'
import Tabs from '../(components)/tabs'

const _tabs = ``

export default function CreateSong() {
  const [ step, setStep ] = useState(0)

  const [ song, setSong ] = useState({
    songId: "", title: "", chordSheetKey: "C", albumCover: "",
    artist: "", album: "", chordSheet: _tabs, isApproved: true,
    version: 1, creator: {} as User, recordings: [] as any, 
  } as Song)

  return <div className="text-white w-full h-screen flex flex-col">
    <div className="flex-0">
      <Tabs step={step} setStep={setStep}  />
    </div>
    
    <div className="flex-1 p-4">
      { step === 0 && <PasteTabs tabs={song.chordSheet || ""} setTabs={(t: string) => { setSong({ ...song, chordSheet: t }) }} /> }
      { step === 1 && <SongInfo song={song} setSong={setSong}/>}
      { step === 2 && <Slides song={song} /> }
    </div>
    <Save song={song} type="create" />
  </div>
}