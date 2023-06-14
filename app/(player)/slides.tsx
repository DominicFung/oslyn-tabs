"use client"

import { chordSheetToSlides } from "@/core/oslyn"
import { OslynSlide } from "@/core/types"
import { Song } from "@/src/API"
import { useEffect, useState } from "react"
import Line from "../songs/(edit)/(components)/line"
import { calcMaxWidthTailwindClass } from "@/core/utils/frontend"
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid"
import Controls from "./controls"
import Image from "next/image"

import { transpose as trans } from "@/core/oslyn"
import { useSideBarContext } from "@/app/context"

interface SlidesProps {
  song: Song
  skey?: string

  page?: number
  setPage?: (p: number) => void

  pt?: boolean
}

export default function Slides(p: SlidesProps) {
  const {openSidebar, setOpenSidebar } = useSideBarContext()

  const [ slides, setSlides ] = useState<OslynSlide>()
  const [ page, _setPage ] = useState(p.page || 0) // dont use directly in html

  const setPage = (n: number) => {
    if (p.setPage) p.setPage(n)
    else _setPage(n)
  }

  useEffect(() => {
    _setPage(p.page || 0)
  }, [p.page])

  const [ wClass, setWClass ] = useState("max-w-screen-sm")
  const [ screen, setScreen ] = useState({ w: 500, h: 500 }) 

  const [transpose, setTranspose] = useState(0)
  const setCapo = (c: string) => { setTranspose(0-Number(c)) }

  useEffect(() => { setScreen({
    w: typeof window !== "undefined" ? window.innerWidth : 500, 
    h: typeof window !== "undefined" ? window.innerHeight : 500
  }) }, [])
  
  useEffect(() => {
    console.log(p.song)
    if (p.song.chordSheet && p.song.chordSheetKey) {
      console.log(p.song.chordSheet)

      const key = trans(p.skey || p.song.chordSheetKey || "C", transpose)
      const oslynSlides = chordSheetToSlides(p.song.chordSheet, key || "C", true)
      console.log(oslynSlides)
      setSlides(oslynSlides)
    }
  }, [p.song, transpose])

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
    <div className={`absolute bottom-0 left-0 px-4 ${openSidebar?"ml-64":"ml-0"} flex flex-row`} style={{
      width: !openSidebar ? screen.w : screen.w-256
    }}>
      { page > 0 ? <button className="flex-1" onClick={() => setPage(page-1)}>
        <div className="w-32 rounded-lg flex justify-center items-center" style={{
          backgroundImage: "linear-gradient(to right, rgba(95,40,212,0.5), rgba(95,40,212,0))", 
          height: screen.h-(p.pt ? 90 : 0)
        }}>
          <ChevronLeftIcon className="w-16 h-16 p-4 text-white"/>
        </div>
      </button> : <div className="flex-1" /> }
      { slides && slides?.pages.length-1 > page ? <button className="flex-1 flex flex-row-reverse" onClick={() => setPage(page+1)}>
        <div className="w-32 rounded-lg flex justify-center items-center" style={{
          backgroundImage: "linear-gradient(to right, rgba(95,40,212,0), rgba(95,40,212,0.5))",
          height: screen.h-(p.pt ? 90 : 0)
        }}>
          <ChevronRightIcon className="w-16 h-16 p-4 text-white"/>
        </div>
      </button> :  <div className="flex-1" /> }
    </div>
    <Controls capo={`${0-transpose}`} setCapo={setCapo} pt={p.pt} />
    {page === 0 && <div className={`absolute left-72 ${p.pt?"top-28":"top-8"} rounded-lg`}>
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