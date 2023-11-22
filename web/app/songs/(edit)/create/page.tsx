"use client"
import { useEffect, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import PasteTabs from "../pasteTabs"
import SongInfo from '../songInfo'
import { Song } from '@/../src/API'
import { User } from '@/../src/API'
import Slides from '@/app/(player)/slides'
import Save from '../(components)/save'
import Tabs from '../(components)/tabs'

const _tabs = ``

export default function CreateSong() {
  const searchParams = useSearchParams()
  
  const [ step, setStep ] = useState(0)
  const [ shareWithBand, setShareWithBand ] = useState("")

  useEffect(() => {
    let swb = searchParams.get("share")
    if (swb) setShareWithBand(swb)
  }, [searchParams])

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
      { step === 2 && <Slides song={song} pt={true} /> }
    </div>
    <Save song={song} type="create" shareWithBand={shareWithBand} goToReviewTab={() => setStep(2)} />
  </div>
}