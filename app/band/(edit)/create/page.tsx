"use client"

import { Band } from "@/src/API"
import { useState } from "react"
import BandInfo from "../../(components)/bandInfo"
import Save from "../../(components)/save"

export default function CreateBand() {
  const [band, setBand] = useState({
    bandId: "", name: "", description: "", imageUrl: ""
  } as Band)

  return <>
    <div className="m-5">
      <BandInfo band={band} setBand={setBand}/>
      <Save band={band} type="create" />
    </div>
  </>
}