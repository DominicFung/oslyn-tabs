"use client"

import { Band } from "@/src/API"
import BandInfo from "../(components)/bandInfo"
import Save from "../(components)/save"

interface BandProps {
  band: Band
}

export default function BandComponent(p: BandProps) {
  return <>
    <div className='relative m-5'>
      <BandInfo band={p.band} setBand={() => {}}/>
    </div>
  </>
}