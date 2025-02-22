"use client"
import { useTheme } from "next-themes"

import { Song } from "@/../src/API"
import Slides from "@/app/(player)/slides"
import { useEffect, useState } from "react"
import Preview from "./preview"
import Controls from "@/app/(player)/controls"


interface ViewsProps {
  song: Song
}

export default function Views(p: ViewsProps) {
  const { theme } = useTheme()
  const [ localTheme, setLocalTheme ] = useState("light")
  useEffect(() => {
    if (theme) setLocalTheme(theme)
    else {
      const a = localStorage.getItem('oslynTheme') || "light"
      if (a && a != "false") { setLocalTheme(a) }
    }
  } , [theme])

  const [ view, setView ] = useState<'PREVIEW'|'PLAYER'>('PLAYER')
  const [ openController, setOpenController] = useState(false)

  const [ sKey, setSKey ] = useState(p.song.chordSheetKey || "C")
  const [transpose, setTranspose] = useState(0)
  const setCapo = (c: string) => { setTranspose(0-Number(c)) }

  const [ textSize, setTextSize ] = useState("text-lg")
  useEffect(() => { const a = localStorage.getItem('jam/textSize') || "text-lg"; if (a && a != "false") { setTextSize(a) } }, [])
  useEffect(() => { localStorage.setItem('jam/textSize', textSize) }, [textSize])
  
  const [ complex, setComplex ] = useState(true)
  useEffect(() => { const a = localStorage.getItem('jam/complex') || "true"; if (a) { setComplex(a === "true") } }, [])
  useEffect(() => { localStorage.setItem('jam/complex', JSON.stringify(complex)) }, [complex])

  const [ fullScreen, setFullScreen ] = useState(false)

  const [ headsUp, setHeadsUp ] = useState(false)
  useEffect(() => { const a = localStorage.getItem('jam/headsUp') || "false"; if (a) { setHeadsUp(a === "true") } }, [])
  useEffect(() => { localStorage.setItem('jam/headsUp', JSON.stringify(headsUp)) }, [headsUp])

  return <>
    { view === 'PREVIEW' && <Preview song={p.song} toggleView={ () => setView('PLAYER') }/>}
    { view === 'PLAYER' && <div className={`text-white w-full h-screen flex flex-col overflow-hidden ${localTheme || "light"}`} id="player">
      { p.song && <Slides song={p.song} skey={sKey} textSize={textSize} complex={complex} headsUp={headsUp} transpose={transpose} isControllerOpen={openController}/> }

      <Controls
        jamSessionId=""
        open={openController}
        setOpen={setOpenController}
        capo={{ capo:`${0-transpose}`, setCapo }} 
        sKey={{ skey: sKey, setKey: setSKey, togglePreview: () => setView('PREVIEW') }}
        display={{ textSize, setTextSize, 
          auto: false, setAuto: () => {}, 
          complex, setComplex,
          fullScreen, setFullScreen,
          headsUp, setHeadsUp
        }}
      />

    </div> }
  </>
}