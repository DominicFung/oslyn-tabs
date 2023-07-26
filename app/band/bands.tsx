"use client"

import { Band } from "@/src/API"
import { useEffect, useState } from "react"
import BandInfo from "./(components)/bandInfo"
import Save from "./(components)/save"
import { useBandContext } from "./(context)/bandContext"

interface BandsProps {
  bands: Band[]
}

export default function Bands(p: BandsProps) {
  const { index } = useBandContext()
  const [band, setBand] = useState(p.bands[0])

  useEffect(() => {
    if (p.bands.length < index) {
      setBand(p.bands[index])
    }
  }, [p.bands, index])

  return <>
    <div className='relative m-5'>
      <BandInfo band={band} setBand={setBand}/>
      <Save band={band} type="create" />
    </div>
  </>
}