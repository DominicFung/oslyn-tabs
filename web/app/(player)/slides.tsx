"use client"

import { chordSheetToSlides } from "@/core/oslyn"
import { OslynSlide } from "@/core/types"
import { Song } from "@/../src/API"
import { useEffect, useState } from "react"
import Line from "./line"
import { calcMaxWidthTailwindClass } from "@/core/utils/frontend"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid"
import Image from "next/image"

import { transpose as trans } from "@/core/oslyn"
import { useSideBarContext } from "@/app/context"

interface SlidesProps {
  song: Song
  skey?: string

  transpose?: number
  textSize?: string
  complex?: boolean
  headsUp?: boolean

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
  const [ transposedKey, setTransposedKey ] = useState(p.skey || p.song.chordSheetKey || "C")

  const setPage = (n: number) => {
    if (p.setPage) p.setPage(n)
    else _setPage(n)
  }

  useEffect(() => {
    _setPage(p.page || 0)
  }, [p.page])

  useEffect(() => {
    let baseKey = p.skey || p.song.chordSheetKey || "C"
    if (p.transpose) baseKey = trans(baseKey, p.transpose) || "C"
    setTransposedKey(baseKey)
  }, [p.transpose, p.skey])

  const [ wClass, setWClass ] = useState("max-w-screen-sm")
  const [ screen, setScreen ] = useState({ w: 300, h: 300 }) 

  useEffect(() => {
    setScreen({
      w: typeof window !== "undefined" ? window.innerWidth : 300, 
      h: typeof window !== "undefined" ? window.innerHeight : 300
    })
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
    setScreen({w: window.innerWidth, h: window.innerHeight})
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
        { slides?.pages && slides?.pages[page]?.lines[0] && <div className="text-gray-500 text-sm italic bold">
          {slides?.pages && slides?.pages[page].lines[0].section}
        </div> }
        { slides?.pages && slides?.pages[page] && slides?.pages[page].lines.map((a, i) => <div key={i}>
          <Line phrase={a} skey={transposedKey} transpose={0} textSize={p.textSize || "text-lg"} decorate={p.complex || false}/>
        </div>)}

        <div className="h-20" />

        { p.headsUp && slides?.pages[page] && slides?.pages[page].extra && slides?.pages[page].extra?.section != slides?.pages[page].lines[0].section && <div className="text-gray-500 text-sm italic bold">
          {slides?.pages && slides?.pages[page].extra?.section}
        </div> }
        { p.headsUp && slides?.pages && slides?.pages[page]?.extra && <div>
          <Line phrase={slides!.pages[page].extra!} skey={transposedKey} transpose={0} secondary textSize={p.textSize || "text-lg"} decorate={p.complex || false}/>
        </div> }
      </div> }
    </div>
    <div className={`absolute bottom-0 left-0 ${openSidebar?"ml-64 w-[calc(100%-16rem)] hidden sm:flex sm:flex-row":"ml-0 w-full flex flex-row"}`}>
      { page > 0 ? <button className={`flex-1 ${p.pt && "fixed left-0 top-0 mt-24 h-[calc(100%-90px)]"} ${p.pt && openSidebar && "ml-64"}`}
      onClick={() => setPage(page-1)}>
        <div className={`w-32 flex justify-center items-center ${p.pt?"h-full":"h-screen"}`} style={{
          backgroundImage: "linear-gradient(to right, rgba(95,40,212,0.5), rgba(95,40,212,0))"
        }}>
          <ChevronLeftIcon className="w-16 h-16 p-4 text-white"/>
        </div>
      </button> : <div className="flex-1" /> }
      { slides && slides?.pages.length-1 > page ? <button className={`flex-1 flex flex-row-reverse ${p.pt && "fixed right-0 top-0 mt-24 h-[calc(100%-90px)]"}`} onClick={() => setPage(page+1)}>
        <div className={`w-32 flex justify-center items-center ${p.pt?"h-full":"h-screen"}`} style={{
          backgroundImage: "linear-gradient(to right, rgba(95,40,212,0), rgba(95,40,212,0.5))"
        }}>
          <ChevronRightIcon className="w-16 h-16 p-4 text-white"/>
        </div>
      </button> : <div className="flex-1" /> }
    </div>
    {page <= 7 && <div className={`absolute ${openSidebar?"left-72": "left-10"} ${p.pt?"top-28":"top-3"} rounded-lg`}>
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