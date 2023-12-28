"use client"

import { chordSheetToOslynSong, convertOslynSongToPages } from "@/core/oslyn"
import { OslynSong } from "@/core/types"
import { Song } from "@/../src/API"
import { useEffect, useState } from "react"
import Slides from "@/app/(player)/slides"
import { useTheme } from "next-themes"

interface ReviewProps {
  song: Song
  skey?: string
}

export default function Review(p: ReviewProps) {
  const { theme } = useTheme()
  const [ localTheme, setLocalTheme ] = useState("light")
  useEffect(() => {
    if (theme) setLocalTheme(theme)
    else {
      const a = localStorage.getItem('oslynTheme') || "light"
      if (a && a != "false") { setLocalTheme(a) }
    }
  } , [theme])

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

  return <>
    { oslynSong?.song && <div className={`text-white w-full h-screen flex flex-col overflow-hidden ${localTheme || "light"}`} id="player">
      { p.song && <Slides song={p.song} pt={true} /> }
    </div> }
  </>
}