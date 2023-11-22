"use client"

import { chordSheetToSlides } from "@/core/oslyn"
import { OslynSlide } from "@/core/types"
import { Song } from "@/../src/API"
import { useEffect, useState } from "react"
import Line from "./line"
import { calcMaxWidthTailwindClass } from "@/core/utils/frontend"
import Image from "next/image"

import { useSideBarContext } from "@/app/context"

interface SlidesProps {
  song: Song  
  textSize: string

  /** page can be externalized / enable graphql call to sync pages */
  page?: number
  setPage?: (p: number) => void

  /** padding top */
  pt?: boolean

  /**  */
  setLastPage?: (b: boolean) => void
}

export default function Slides(p: SlidesProps) {
  const { openSidebar } = useSideBarContext()

  const [ slides, setSlides ] = useState<OslynSlide>()
  const [ page, _setPage ] = useState(p.page || 0) // dont use directly in html

  useEffect(() => { _setPage(p.page || 0) }, [p.page])

  const [ wClass, setWClass ] = useState("max-w-screen-sm")

  useEffect(() => {
    requestWakeLock()
    window.addEventListener("resize", updateWindowDimensions)
    window.addEventListener("orientationchange", updateWindowDimensions)

    return () => { 
      window.removeEventListener("resize", updateWindowDimensions)
      window.removeEventListener("orientationchange", updateWindowDimensions)
    }
  }, [])

  useEffect(() => {
    if (p.setLastPage) {
      if (slides?.pages && slides.pages.length-1 === page) {
        p.setLastPage(true)
      } else p.setLastPage(false)
    }
  }, [p.setLastPage, page, slides])
  
  useEffect(() => {
    console.log(p.song)
    if (p.song.chordSheet && p.song.chordSheetKey) {
      console.log(p.song.chordSheet)
      const oslynSlides = chordSheetToSlides(p.song.chordSheet, p.song.chordSheetKey || "C")
      console.log(oslynSlides)
      setSlides(oslynSlides)
    }
  }, [p.song])

  useEffect(() => {
    if (slides && slides.pages[page]) {
      const a = slides.pages[page].lines.map((a) => a.lyric)
      if (slides.pages[page].extra) a.push(slides.pages[page].extra?.lyric!)
      const w = calcMaxWidthTailwindClass(a)
      console.log(w)
      setWClass(w)
    }
  }, [slides, page])

  const updateWindowDimensions = () => {
    zoomOutMobile()
  }

  const zoomOutMobile = () => {
    const viewport = document.querySelector('meta[name="viewport"]');

    if ( viewport ) {
      (viewport as any).content = 'initial-scale=1';
      (viewport as any).content = 'width=device-width';
    }
  }

  const requestWakeLock = async () => {
    if (window.navigator && "wakeLock" in window.navigator) {
      let wakeLock = null

      // create an async function to request a wake lock
      try {
        wakeLock = await (window.navigator.wakeLock as any).request("screen")
        console.log("wake lock activated.")
      } catch (err) { console.error(err) }
    } else {
      console.error("Wake lock not supported on this browser. Your device may dim.")
    }
  }


  return <>
    <div className={`flex justify-center items-center h-full m-auto ${wClass}`}>
      { !slides?.pages[page] && <div className="text-white">Sorry something went wrong. Click on the gear, and select a new song to reset the system.</div> }
      { slides?.pages[page] && <div>
        { slides?.pages && slides?.pages[page] && slides?.pages[page].lines.map((a, i) => <div key={i}>
          <Line phrase={a} textSize={p.textSize} />
        </div>)}

        <div className="h-20" />
      </div> }
    </div>
   
    {page === 0 && <div className={`absolute ${openSidebar?"left-72": "left-10"} ${p.pt?"top-28":"top-3"} rounded-lg`}>
      <div className="flex flex-row hover:cursor-pointer">
        {p.song.albumCover && <Image src={p.song.albumCover} alt={p.song.album || ""} width={200} height={200} className="w-20 m-2"/> }
        <div className="m-2">
          <div className="text-gray-500 bold">{p.song.title}</div>
          <div className="text-gray-600 text-xs">{p.song.artist}</div>
        </div>
      </div>
    </div>}
  </>
}