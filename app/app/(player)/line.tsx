import { OslynPhrase } from "../../core/types"
import { getChordByNumber } from "../../core/oslyn"
import React, { memo, useEffect, useRef, useState } from "react"

import { TextLayoutEventData, NativeSyntheticEvent, Text, View } from 'react-native'
import { randomUUID } from "expo-crypto"
import { acceptChordLineWidth, acceptMeasuredWidth, chordOffsets, ChordLineWidths, layoutSize, slideLyricText, textLayoutWidth } from "../../src/lyricMeasure"

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

function Line(p: LineProps) {
  const [ uuid, _setUuid ] = useState<string>(randomUUID())

  const [ phrase, setPhrase ] = useState<OslynPhrase>(p.phrase)
  const textSize = p.textSize || "text-lg"
  const [ widths, setWidths ] = useState<number[]>(() => seedWidths(p.phrase, textSize))
  const [ maxWidth, setMaxWidth ] = useState<ChordLineWidths>({ line: 0, chord: 0 })
  const chordsReady = widths.length === 0 || widths.every((width) => width >= 0)
  const lockedWidths = useRef<boolean[]>([])
  const phraseKey = `${p.phrase.lyric}\0${p.skey}\0${textSize}\0${p.phrase.chords.map((chord) => `${chord.position}:${chord.chord}`).join(',')}`

  const seenPhrase = useRef(phraseKey)

  useEffect(() => {
    if (seenPhrase.current === phraseKey) return
    seenPhrase.current = phraseKey
    setPhrase(p.phrase)
    setWidths(seedWidths(p.phrase, textSize))
    lockedWidths.current = []
    setMaxWidth({ line: 0, chord: 0 })
  }, [phraseKey])

  const onLyricLayout = (width: number, i: number) => {
    if (lockedWidths.current[i]) return
    const rounded = acceptMeasuredWidth(0, width)
    if (!rounded) return
    lockedWidths.current[i] = true
    setWidths((prev) => {
      if (prev[i] === rounded) return prev
      const next = [...prev]
      next[i] = rounded
      return next
    })
  }

  const onMaxWidth = (width: number, part: 'line' | 'chord') => {
    setMaxWidth((prev) => {
      const next = acceptChordLineWidth(prev, part, width)
      if (part === 'line' && next.line < prev.line) return prev
      if (part === 'chord' && next.chord < prev.chord) return prev
      return next
    })
  }

  const onMaxLineWidth = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const width = textLayoutWidth(event)
    onMaxWidth(width, 'line')
  }
  const onMaxChordWidth = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    const width = textLayoutWidth(event)
    onMaxWidth(width, 'chord')
  }

  const charWidth = estimateSliceWidth(1, textSize)
  const offsets = chordOffsets(phrase.lyric, phrase.chords.map((chord) => chord.position), charWidth)
  const chordSpan = offsets.length ? offsets[offsets.length - 1] + charWidth * 4 : 0

  useEffect(() => {
    const width = Math.max(maxWidth.line, maxWidth.chord)
    if (width > 0) p.onMaxWidth(width)
  }, [maxWidth, p.onMaxWidth])

  const combineChordLyricForWidthCalculation = () => {
    const lyric = phrase.lyric.trim()
    const last = phrase.chords[phrase.chords.length - 1]
    if (!last) return lyric
    if (last.position < lyric.length) {
      return lyric.slice(0, last.position + 1) +
        getChordByNumber(last.chord, last.isMinor, p.skey) +
        (p.decorate ? last.decorator || '' : '')
    }
    let i = 0
    while (i < phrase.chords.length) {
      if (phrase.chords[i].position > lyric.length - 1) break
      i = i + 1
    }
    let s = lyric
    for (let j = i; j < phrase.chords.length; j++) {
      const chord = phrase.chords[j]
      const gap = Math.max(0, chord.position + 1 - s.length)
      s = s + ' '.repeat(gap) +
        getChordByNumber(chord.chord, chord.isMinor, p.skey) +
        (p.decorate ? chord.decorator || '' : '')
    }
    return s
  }

  return <>
    {phrase.lyric.trim() === "" && <View
      style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', minHeight: 48, minWidth: chordSpan }}
      onLayout={(event) => {
        const width = layoutSize(event).width
        if (maxWidth.line > 0) return
        onMaxWidth(width, 'line')
      }}
    >
      {phrase.chords.map((c, i) => {
        const chord = getChordByNumber(c.chord, c.isMinor, p.skey) || ''
        const gap = i === 0 ? 0 : Math.max(charWidth, offsets[i] - offsets[i - 1])
        return <Text key={`${uuid}-a${i}`}
          style={{
            marginLeft: gap,
            borderRadius: 6,
            overflow: 'visible',
            backgroundColor: p.secondary ? '#374151' : '#6d28d9',
            color: '#fff',
            paddingHorizontal: 6,
            paddingVertical: 2,
            fontWeight: '700',
            fontSize: 16,
          }}>
          {chord}{p.decorate && c.decorator}
        </Text>
      })}
    </View>}
    {phrase.lyric.trim() !== "" && <View style={{ alignSelf: 'flex-start', position: 'relative', marginTop: 24, minHeight: 48, minWidth: chordSpan, overflow: 'visible' }}>
      {p.loaded && chordsReady && phrase.chords.map((c, i) => {
        const chord = getChordByNumber(c.chord, c.isMinor, p.skey) || ""
        const pastLyric = c.position >= phrase.lyric.length
        const left = pastLyric ? offsets[i] : sum(widths, i)
        return <Text key={`${uuid}-a${i}`}
          style={{
            position: 'absolute', left: left || 0, top: 0, borderRadius: 6, overflow: 'visible',
            backgroundColor: p.secondary ? '#374151' : '#6d28d9', color: '#fff',
            paddingHorizontal: 6, paddingVertical: 2, fontWeight: '700', fontSize: 16,
          }}
          className={`${p.textSize || "text-lg"}`}>
            {chord}{p.decorate && c.decorator}
          </Text>
      })}

      <View style={{ flexDirection: 'row', flexWrap: 'nowrap', alignSelf: 'flex-start', marginTop: 28 }}>
        <Text key={uuid} style={{ flexShrink: 0 }}
          className={`${p.textSize || "text-lg"} ${p.secondary ? "text-gray-700 dark:text-gray-400": "text-oslyn-700 dark:text-oslyn-200"}`}>
          {slideLyricText(phrase.lyric)}
        </Text>
      </View>

      <View pointerEvents="none" style={{ position: 'absolute', opacity: 0, left: 0, top: 0, width: 20000, flexDirection: 'row', flexWrap: 'nowrap' }}>
        {phrase.chords.map((c, i) => {
          const start = i === 0 ? 0 : phrase.chords[i - 1].position
          const lyric = phrase.lyric.slice(start, c.position) || ' '
          return <Text
            key={`${uuid}-b${i}`}
            style={{ flexShrink: 0 }}
            onTextLayout={(event) => {
              const width = textLayoutWidth(event)
              onLyricLayout(width, i)
            }}
            onLayout={(event) => {
              const width = layoutSize(event).width
              onLyricLayout(width, i)
            }}
            className={p.textSize || 'text-lg'}
          >{lyric}</Text>
        })}
        <Text key={`${uuid}-line`} style={{ flexShrink: 0 }} onTextLayout={onMaxLineWidth} className={p.textSize || 'text-lg'}>
          {slideLyricText(phrase.lyric)}
        </Text>
        <Text key={`${uuid}-bs`} style={{ flexShrink: 0 }} onTextLayout={onMaxChordWidth} className={p.textSize || 'text-lg'}>
          {combineChordLyricForWidthCalculation()}
        </Text>
      </View>
    </View> }
  </>
}

export default memo(Line)
