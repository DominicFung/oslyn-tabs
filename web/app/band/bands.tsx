"use client"

import { Band, User, Song } from "@/../src/API"
import { useEffect, useState } from "react"
import BandInfo from "./(components)/bandInfo"
import Save from "./(components)/save"
import { useBandContext } from "./context"
import SongTable from "@/app/(components)/(song)/songTable"
import ShareSongs from "./(components)/share"

interface BandsProps {
  user: User
  bands: Band[]
  songs: Song[]
}

export default function Bands(p: BandsProps) {
  const { index } = useBandContext()
  const [band, setBand] = useState(p.bands[0])

  useEffect(() => {
    if (p.bands.length > index) { setBand(p.bands[index]) }
  }, [p.bands, index])

  return <>
    <div className='m-5 grid grid-cols-2 2xl:grid-cols-3 gap-4'>
      <div className="col-span-1">
        <BandInfo band={band} setBand={setBand}/>
      </div>

      { band && band.songs && <div className="2xl:col-span-2">
        <ShareSongs user={p.user} band={band} songs={p.songs}/>

        <SongTable user={p.user} songs={band.songs as Song[] || []} type={"own"} />
      </div> }
    </div>

    { band && <Save band={band} type="create" /> }
  </>
}