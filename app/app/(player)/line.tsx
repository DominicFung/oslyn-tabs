import { OslynPhrase } from "oslyn-core/types"
import { getChordByNumber } from "oslyn-core/oslyn"
import React, { useEffect, useState } from "react"

import { TextLayoutEventData, NativeSyntheticEvent, Text, View } from 'react-native'
import { randomUUID } from "expo-crypto"

export interface LineProps {
  phrase: OslynPhrase
  skey: string
  transpose: number
  onMaxWidth: (w: number) => void
  loaded: boolean

  secondary?: boolean
  textSize?: string
  decorate?: boolean
}

function sum(arr: number[], i: number): number {
  if (i < 0 || i >= arr.length) { throw new Error('Index out of bounds'); }
  const sum = arr.slice(0, i+1).reduce((acc, num) => acc + num, 0);
  return sum;
}

export default function Line(p: LineProps) {
  const [ uuid, _setUuid ] = useState<string>(randomUUID())

  const [ phrase, setPhrase ] = useState<OslynPhrase>(p.phrase)
  const [ widths, setWidths ] = useState<number[]>(new Array(p.phrase.chords.length).fill(-1))
  const [ maxWidth, setMaxWidth ] = useState({ lineWidth: 0, lastChordWidth: 0 })

  useEffect(() => {
    if (p.phrase) { 
      setPhrase(p.phrase)
      setWidths(new Array(p.phrase.chords.length).fill(-1))
    }
  }, [p.phrase])

  const onLyricLayout = (event: NativeSyntheticEvent<TextLayoutEventData>, i: number) => {
    const w = event.nativeEvent?.lines[0]?.width || 0
    setWidths((prev) => {
      if (prev.length <= 0) { return [] }
      prev[i] = w
      return [...prev]
    })
  }

  const onMaxWidth = (event: NativeSyntheticEvent<TextLayoutEventData>, e: "line"|"chord") => {
    const w = event.nativeEvent?.lines[0]?.width || 0
    console.log(`ON MAX WIDTH - ${ w } , ${e}`)
    if (e === "line") { setMaxWidth((prev) => { return { ...prev, lineWidth: w } }) }
    if (e === "chord") { setMaxWidth((prev) => { return { ...prev, lastChordWidth: w } }) }
  }

  const onMaxLineWidth = (event: NativeSyntheticEvent<TextLayoutEventData>) => { onMaxWidth(event, "line") }
  const onMaxChordWidth = (event: NativeSyntheticEvent<TextLayoutEventData>) => { onMaxWidth(event, "chord") }

  useEffect(() => {
    if (!maxWidth.lineWidth || !maxWidth.lastChordWidth) return
    p.onMaxWidth(Math.max(maxWidth.lineWidth, maxWidth.lastChordWidth) + 8 /* to account for px-1 */)
  }, [maxWidth])

  return <>
    { phrase && phrase.lyric.trim() != "" && <View className="relative h-12 mt-6">
      <View>
        {p.loaded && phrase.chords.map((c, i) => { 
          const chord = getChordByNumber(c.chord, c.isMinor, p.skey) || ""
          const s = sum(widths, i);

          return <Text key={`${uuid}-a${i}`} className={`absolute ${p.textSize || "text-lg"} bold ${p.secondary ? "bg-gray-700 text-gray-400" : "bg-oslyn-700 text-white" } px-1`} 
            style={{ marginLeft: s || 0, left: 0, top: -24, borderRadius: 6, overflow: "hidden"}}>
              {chord}{p.decorate && c.decorator}
            </Text>

        })}
      </View>

      <View>
        <Text key={uuid} onTextLayout={onMaxLineWidth}
          className={`${p.textSize || "text-lg"} ${p.secondary ? "text-gray-700 dark:text-gray-400": "text-oslyn-700 dark:text-oslyn-200"} whitespace-nowrap`}>
          {phrase.lyric.trim()}
        </Text>
        
        {/** FOR CALCULATIONS ONLY - lyric length */}
        { phrase.chords.map((c, i) => {
          const start = i === 0 ? 0 : phrase.chords[i-1].position
          const lyric = phrase.lyric.slice(start, c.position)
          return <Text className={`absolute h-0 opacity-0 ${p.textSize || "text-lg"}`} key={`${uuid}-b${i}`} numberOfLines={1} onTextLayout={(e) => { onLyricLayout(e, i) } }>{lyric}</Text>
        })}

        {/** FOR CALCULATIONS ONLY - last chord length */}
        <Text className={`absolute h-0 opacity-0 ${p.textSize || "text-lg"}`} key={`${uuid}-bs`} numberOfLines={1} onTextLayout={onMaxChordWidth}>
          {phrase.lyric.slice(0, phrase.chords[phrase.chords.length-1].position < phrase.lyric.length-1 ? phrase.chords[phrase.chords.length-1].position + 1 : phrase.chords[phrase.chords.length-1].position) + 
            getChordByNumber(phrase.chords[phrase.chords.length-1].chord, phrase.chords[phrase.chords.length-1].isMinor, p.skey) +
            (p.decorate && phrase.chords[phrase.chords.length-1].decorator)
          }
        </Text>
      </View>
    </View> }
  </>
}
