"use client"

import { OslynPhrase } from "@/core/types"
import { getChordByNumber } from "@/core/oslyn"

export interface LineProps {
  phrase: OslynPhrase
  skey: string
  transpose: number
}

export default function Line(p: LineProps) {

  const calculateWidth = (t: string) => {
    let text = document.createElement("span")
    document.body.appendChild(text)
    text.className = "text-lg"
    text.innerHTML = t

    text.style.height = 'auto';
    text.style.width = 'auto';
    text.style.position = 'absolute';
    text.style.whiteSpace = 'no-wrap';

    let width = text.clientWidth
    document.body.removeChild(text)
    return width
  }

  return <div className="relative h-12">
    {p.phrase.chords.map((c, i) => { 
      const chord = getChordByNumber(c.chord, c.isMinor, p.skey)
      const width = calculateWidth(p.phrase.lyric.substring(0, c.position))
      return<span className="absolute text-lg bold bg-blue-900 px-1 rounded-lg" style={{
        marginLeft: `${width}px`, left: 0, top: -20}} key={i}>{chord}</span>
    })}
    <div className="text-lg text-blue-300 whitespace-nowrap">{p.phrase.lyric}</div>
  </div>
}