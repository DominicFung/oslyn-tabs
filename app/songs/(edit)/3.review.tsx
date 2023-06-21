"use client"

import { chordSheetToOslynSong, convertOslynSongToPages } from "@/core/oslyn"
import { OslynSong } from "@/core/types"
import { Song } from "@/src/API"
import { useEffect, useState } from "react"
import Line from "../../(player)/line"

interface ReviewProps {
  song: Song
  skey?: string
}

export default function Review(p: ReviewProps) {
  const [oslynSong, setOslynSong] = useState<OslynSong>()
  
  useEffect(() => {
    if (p.song.chordSheet && p.song.chordSheetKey) {
      console.log(p.song.chordSheet)
      const oslynSong = chordSheetToOslynSong(p.song.chordSheet, p.skey || p.song.chordSheetKey || "C")
      console.log(oslynSong)
      setOslynSong(oslynSong)

      let oslynPage = convertOslynSongToPages(oslynSong)
      console.log("OSLYN PAGE")
      console.log(oslynPage)
    }
  }, [p.song])

  return <div>
    { oslynSong?.song && oslynSong?.song.map((a, i) => <div key={i}>
      <Line key={i} phrase={a} skey={p.skey || p.song.chordSheetKey || "C"} transpose={0}/>
    </div>)}
  </div>
}