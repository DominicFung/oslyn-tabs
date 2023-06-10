"use client"

import { OslynPhrase } from "@/core/types"
import { getChordByNumber } from "@/core/oslyn"
import { calculateWidth } from "@/core/utils/frontend"

export interface LineProps {
  phrase: OslynPhrase
  skey: string
  transpose: number

  secondary?: boolean
  textSize?: string
}

export default function Line(p: LineProps) {
  return <div className="relative h-12 mt-6">
    {p.phrase.chords.map((c, i) => { 
      const chord = getChordByNumber(c.chord, c.isMinor, p.skey)
      const width = calculateWidth(p.phrase.lyric.substring(0, c.position), p.textSize  || "text-lg")
      return<span className={`absolute ${p.textSize || "text-lg"} bold ${p.secondary ? "bg-gray-700 text-gray-400" : "bg-oslyn-700 text-white" } px-1 rounded-lg`} style={{
        marginLeft: `${width}px`, left: 0, top: -24}} key={i}>{chord}</span>
    })}
    <div className={`${p.textSize || "text-lg"} ${p.secondary ? "text-gray-400": "text-oslyn-200"} whitespace-nowrap`}>{p.phrase.lyric}</div>
  </div>
}