import { OslynPhrase } from "../../core/types"
import { getChordByNumber } from "../../core/oslyn"
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

function estimateSliceWidth(characters: number, textSize: string) {
  switch (textSize) {
    case "text-xs": return characters * 2
    case "text-sm": return characters * 4
    case "text-base": return characters * 6
    case "text-lg": return characters * 8
    case "text-xl": return characters * 10
    case "text-2xl": return characters * 12
    case "text-3xl": return characters * 14
    default: return characters * 6
  }
}

function seedWidths(phrase: OslynPhrase, textSize: string) {
  return phrase.chords.map((chord, index) => {
    const start = index === 0 ? 0 : phrase.chords[index - 1].position
    const lyric = phrase.lyric.slice(start, chord.position)
    return Math.max(estimateSliceWidth(Math.max(lyric.length, 1), textSize), 8)
  })
}

export default function Line(p: LineProps) {
  const [ uuid, _setUuid ] = useState<string>(randomUUID())

  const [ phrase, setPhrase ] = useState<OslynPhrase>(p.phrase)
  const textSize = p.textSize || "text-lg"
  const [ widths, setWidths ] = useState<number[]>(() => seedWidths(p.phrase, textSize))
  const [ maxWidth, setMaxWidth ] = useState({ lineWidth: 0, lastChordWidth: 0 })
  const chordsReady = widths.length === 0 || widths.every((width) => width >= 0)

  useEffect(() => {
    if (p.phrase) { 
      setPhrase(p.phrase)
      setWidths(seedWidths(p.phrase, p.textSize || "text-lg"))
    }
  }, [p.phrase])

  const onLyricLayout = (event: NativeSyntheticEvent<TextLayoutEventData>, i: number) => {
    const w = event.nativeEvent?.lines[0]?.width || 0
    if (!w) return
    setWidths((prev) => {
      if (prev.length <= i || prev[i] === w) return prev
      const next = [...prev]
      next[i] = w
      return next
    })
  }

  const onMaxWidth = (event: NativeSyntheticEvent<TextLayoutEventData>, e: "line"|"chord") => {
    const w = event.nativeEvent?.lines[0]?.width || 0
    console.log(`ON MAX WIDTH - ${ w } , ${e} "${event.nativeEvent?.lines[0].text}"`)
    if (e === "line") { setMaxWidth((prev) => { return { ...prev, lineWidth: w } }) }
    if (e === "chord") { setMaxWidth((prev) => { return { ...prev, lastChordWidth: w } }) }
  }

  const onMaxLineWidth = (event: NativeSyntheticEvent<TextLayoutEventData>) => { onMaxWidth(event, "line") }
  const onMaxChordWidth = (event: NativeSyntheticEvent<TextLayoutEventData>) => { onMaxWidth(event, "chord") }

  useEffect(() => {
    if (!maxWidth.lineWidth || !maxWidth.lastChordWidth) return
    p.onMaxWidth(Math.max(maxWidth.lineWidth, maxWidth.lastChordWidth) + 8 /* to account for px-1 */)
  }, [maxWidth])

  // this is ONLY used for substring with spaces.
  const calculateWidth = (position: number, textSize: string) => {
    switch (textSize) {
      case "text-xs":   return position * 2
      case "text-sm":   return position * 4
      case "text-base": return position * 6
      case "text-lg":   return position * 8
      case "text-xl":   return position * 10
      case "text-2xl":  return position * 12
      case "text-3xl":  return position * 14
      default: return position * 6
    }
  }

  const combineChordLyricForWidthCalculation = () => {
    const lyric = phrase.lyric.trim()
    if (phrase.chords[phrase.chords.length-1].position < lyric.length) {
      let s = lyric.slice(0, phrase.chords[phrase.chords.length-1].position + 1) + 
              getChordByNumber(phrase.chords[phrase.chords.length-1].chord, phrase.chords[phrase.chords.length-1].isMinor, p.skey) +
              (p.decorate && phrase.chords[phrase.chords.length-1].decorator)

      console.log(`^_^ ${s}`)
      return s
    } else {
      console.log("here")
      let i = 0 // is the index of the FIRST chord outside the max lyric length
      while (i < phrase.chords.length) {
        if (phrase.chords[i].position > lyric.length-1) break;
        i=i+1
      }

      let s = lyric
      for (let j=i; j<phrase.chords.length; j++) {
        console.log(`CHORD WORK: ${getChordByNumber(phrase.chords[j].chord, phrase.chords[j].isMinor, p.skey)} ${phrase.chords[j].position-s.length}`)
        s = s + " ".repeat(phrase.chords[j].position+1-s.length) + 
        getChordByNumber(phrase.chords[j].chord, phrase.chords[j].isMinor, p.skey) +
        (p.decorate && phrase.chords[j].decorator)
      }
      return s
    }
  }

  return <>
    {p.loaded && phrase.lyric.trim() === "" && <View className="relative h-12 mt-6" style={{ alignSelf: 'flex-start' }}>
      { phrase.chords.map((c, i) => { 
        const chord = getChordByNumber(c.chord, c.isMinor, p.skey)
        const width = calculateWidth(c.position, p.textSize  || "text-lg")

        if (i < phrase.chords.length - 1)
          return <Text key={`${uuid}-a${i}`} className={`${p.textSize || "text-lg"} bold ${p.secondary ? "bg-gray-700 text-gray-400" : "bg-oslyn-700 text-white" } px-1`} 
                    style={{ position: 'absolute', marginLeft: width, left: 0, top: -24, borderRadius: 6, overflow: "hidden"}}>
                      {chord}{p.decorate && c.decorator}
                  </Text>
        else 
          return <Text key={`${uuid}-a${i}`} className={`${p.textSize || "text-lg"} bold ${p.secondary ? "bg-gray-700 text-gray-400" : "bg-oslyn-700 text-white" } px-1`} 
                    style={{ position: 'absolute', marginLeft: width, left: 0, top: -24, borderRadius: 6, overflow: "hidden"}} onTextLayout={onMaxChordWidth}>
                      {chord}{p.decorate && c.decorator}
                  </Text>
      })}
    </View> }
    { phrase && phrase.lyric.trim() != "" && <View style={{ alignSelf: 'flex-start', position: 'relative', marginTop: 24, minHeight: 48 }}>
      {p.loaded && chordsReady && phrase.chords.map((c, i) => {
        const chord = getChordByNumber(c.chord, c.isMinor, p.skey) || ""
        const s = sum(widths, i)
        return <Text key={`${uuid}-a${i}`}
          style={{
            position: 'absolute', left: s || 0, top: 0, borderRadius: 6, overflow: 'hidden',
            backgroundColor: p.secondary ? '#374151' : '#6d28d9', color: '#fff',
            paddingHorizontal: 6, paddingVertical: 2, fontWeight: '700', fontSize: 16,
          }}
          className={`${p.textSize || "text-lg"}`}>
            {chord}{p.decorate && c.decorator}
          </Text>
      })}

      <View style={{ flexDirection: 'row', alignSelf: 'flex-start', marginTop: 28 }} onLayout={(event) => {
        const width = event.nativeEvent.layout.width
        if (width > 0) p.onMaxWidth(Math.ceil(width) + 8)
      }}>
        <Text key={uuid} onTextLayout={onMaxLineWidth} numberOfLines={1}
          className={`${p.textSize || "text-lg"} ${p.secondary ? "text-gray-700 dark:text-gray-400": "text-oslyn-700 dark:text-oslyn-200"}`}>
          {phrase.lyric.trim()}
        </Text>
      </View>

      <View pointerEvents="none" style={{ position: 'absolute', opacity: 0, flexDirection: 'row', left: 0, top: 0 }}>
        {phrase.chords.map((c, i) => {
          const start = i === 0 ? 0 : phrase.chords[i - 1].position
          const lyric = phrase.lyric.slice(start, c.position) || ' '
          return <Text
            key={`${uuid}-b${i}`}
            numberOfLines={1}
            onTextLayout={(e) => { onLyricLayout(e, i) }}
            onLayout={(event) => {
              const width = event.nativeEvent.layout.width
              if (width > 0) onLyricLayout({ nativeEvent: { lines: [{ width, text: lyric }] } } as NativeSyntheticEvent<TextLayoutEventData>, i)
            }}
            className={p.textSize || 'text-lg'}
          >{lyric}</Text>
        })}
        <Text key={`${uuid}-bs`} numberOfLines={1} onTextLayout={onMaxChordWidth} className={p.textSize || 'text-lg'}>
          {combineChordLyricForWidthCalculation()}
        </Text>
      </View>
    </View> }
  </>
}
