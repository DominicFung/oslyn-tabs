import { OslynPhrase } from "oslyn-core/types"
import { getChordByNumber } from "oslyn-core/oslyn"
import { findVowels, insert, locations, substituteString } from "oslyn-core/utils/frontend"
import { useEffect, useState } from "react"

import { TextLayoutEventData, NativeSyntheticEvent, Text, View } from 'react-native'
import { randomUUID } from "expo-crypto"

export interface LineProps {
  phrase: OslynPhrase
  skey: string
  transpose: number
  onMaxWidth: (w: number) => void

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

  const onMaxWidth = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const w = event.nativeEvent?.lines[0]?.width || 0
    console.log(`ON MAX WIDTH: ${w}`)
    p.onMaxWidth(w)
  }

  return <>
    { phrase && phrase.lyric.trim() != "" && <View className="relative h-12 mt-6">
      <View>
        { phrase.chords.map((c, i) => { 
          const chord = getChordByNumber(c.chord, c.isMinor, p.skey) || ""
          const s = sum(widths, i);

          return <Text key={`${uuid}-a${i}`} className={`absolute ${p.textSize || "text-lg"} bold ${p.secondary ? "bg-gray-700 text-gray-400" : "bg-oslyn-700 text-white" } px-1 rounded-lg`} style={{
            marginLeft: s || 0, left: 0, top: -24}}>{chord}{p.decorate && c.decorator}</Text>
        })}
      </View>

      <View>
        <Text key={uuid} onTextLayout={onMaxWidth}
          className={`${p.textSize || "text-lg"} ${p.secondary ? "text-gray-700 dark:text-gray-400": "text-oslyn-700 dark:text-oslyn-200"} whitespace-nowrap`}>
          {phrase.lyric.trim()}
        </Text>
        
        {/** FOR CALCULATIONS ONLY */}
        { phrase.chords.map((c, i) => {
          const start = i === 0 ? 0 : phrase.chords[i-1].position
          const lyric = phrase.lyric.slice(start, c.position)
          return <Text className={`absolute h-0 opacity-0 ${p.textSize || "text-lg"}`} key={`${uuid}-b${i}`} numberOfLines={1} onTextLayout={(e) => { onLyricLayout(e, i) } }>{lyric}</Text>
        })}
      </View>

    </View> }
  </>
}
