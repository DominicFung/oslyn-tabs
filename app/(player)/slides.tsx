"use client"

import { chordSheetToSlides, convertOslynSongToPages } from "@/core/oslyn"
import { OslynSlide } from "@/core/types"
import { Song } from "@/src/API"
import { useEffect, useState } from "react"
import Line from "../songs/(edit)/(components)/line"
import { calcMaxWidthTailwindClass } from "@/core/utils/frontend"
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid"

interface SlidesProps {
  song: Song
  skey?: string
}

export default function Slides(p: SlidesProps) {
  const [ slides, setSlides ] = useState<OslynSlide>()
  const [ page, setPage ] = useState(1)

  const [ wClass, setWClass ] = useState("max-w-screen-sm")
  const [ screen, setScreen ] = useState({ w: window.innerWidth, h: window.innerHeight }) 
  
  
  useEffect(() => {
    console.log(p.song)
    if (p.song.chordSheet && p.song.chordSheetKey) {
      console.log(p.song.chordSheet)
      const oslynSlides = chordSheetToSlides(p.song.chordSheet, p.skey || p.song.chordSheetKey || "C", true)
      console.log(oslynSlides)
      setSlides(oslynSlides)
    }
  }, [p.song])

  useEffect(() => {
    if (slides) {
      const a = slides.pages[page].lines.map((a) => a.lyric)
      if (slides.pages[page].extra) a.push(slides.pages[page].extra?.lyric!)
      const w = calcMaxWidthTailwindClass(a)
      console.log(w)
      setWClass(w)
    }
  }, [slides, page])

  useEffect(() => {
    window.addEventListener("resize", updateWindowDimensions)
    return () => window.removeEventListener("resize", updateWindowDimensions)
  }, [])

  const updateWindowDimensions = () => {
    setScreen({w: window.innerWidth, h: window.innerHeight})
  }

  return <>
    <div className={`flex justify-center items-center h-full m-auto ${wClass}`}>
      <div>
        { slides?.pages && slides?.pages[page].lines[0] && <div className="text-gray-500 text-sm italic bold">
          {slides?.pages && slides?.pages[page].lines[0].section}
        </div> }
        { slides?.pages && slides?.pages[page].lines.map((a, i) => <div key={i}>
          <Line phrase={a} skey={p.skey || p.song.chordSheetKey || "C"} transpose={0} textSize="text-xl"/>
        </div>)}

        <div className="h-20" />

        { slides?.pages[page].extra && slides?.pages[page].extra?.section != slides?.pages[page].lines[0].section && <div className="text-gray-500 text-sm italic bold">
          {slides?.pages && slides?.pages[page].extra?.section}
        </div> }
        { slides?.pages && slides?.pages[page].extra && <div>
          <Line phrase={slides!.pages[page].extra!} skey={p.skey || p.song.chordSheetKey || "C"} transpose={0} secondary textSize="text-xl"/>
        </div> }
      </div>
    </div>
    <div className="absolute bottom-0 left-0 px-4 sm:ml-64 flex flex-row" style={{width: screen.w-256}}>
      { page > 0 ? <button className="flex-1" onClick={() => setPage(page-1)}>
        <div className="w-32 rounded-lg flex justify-center items-center" style={{
          backgroundImage: "linear-gradient(to right, rgba(95,40,212,0.5), rgba(95,40,212,0))", 
          height: screen.h-90
        }}>
          <ChevronLeftIcon className="w-16 h-16 p-4"/>
        </div>
      </button> : <div className="flex-1" /> }
      { slides && slides?.pages.length-1 > page ? <button className="flex-1 flex flex-row-reverse" onClick={() => setPage(page+1)}>
        <div className="w-32 rounded-lg flex justify-center items-center" style={{
          backgroundImage: "linear-gradient(to right, rgba(95,40,212,0), rgba(95,40,212,0.5))",
          height: screen.h-90
        }}>
          <ChevronRightIcon className="w-16 h-16 p-4"/>
        </div>
      </button> :  <div className="flex-1" /> }
    </div>
  </>
}