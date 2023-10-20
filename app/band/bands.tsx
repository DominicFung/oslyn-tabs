"use client"

import { Band, User, Song } from "@/src/API"
import { useEffect, useState } from "react"
import BandInfo from "./(components)/bandInfo"
import Save from "./(components)/save"
import { useBandContext } from "./context"
import SongTable from "@/app/(components)/(song)/songTable"

interface BandsProps {
  user: User
  bands: Band[]
}

export default function Bands(p: BandsProps) {
  const { index } = useBandContext()
  const [band, setBand] = useState(p.bands[0])

  useEffect(() => {
    if (p.bands.length > index) { setBand(p.bands[index]) }
  }, [p.bands, index])

  return <>
    <div className='relative m-5'>
      <BandInfo band={band} setBand={setBand}/>

      { band.songs && <div className="mt-12">
        <SongTable user={p.user} songs={band.songs as Song[] || []} type={"own"} />
      </div> }
      

      <Save band={band} type="create" />
    </div>
  </>
}