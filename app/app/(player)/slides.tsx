import { chordSheetToSlides, clampSlideIndex } from '../../core/oslyn'
import { OslynSlide } from '../../core/types'
import { Song } from '../../src/API'
import React, { useCallback, useEffect, useState } from 'react'
import Line from './line'
import { transpose as trans } from '../../core/oslyn'
import { Image, Linking, Pressable, Text, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useKeepAwake } from 'expo-keep-awake'
import Svg, { Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { lyricPlacement } from '../../src/jamLayout'
import { layoutSize, queueMeasuredHeight, acceptMeasuredWidth } from '../../src/lyricMeasure'
import { ultimateGuitarSearchUrl } from '../../src/jamPlaylist'
import { useTheme } from '../../src/theme'

interface SlidesProps {
  song: Song
  skey?: string
  transpose?: number
  textSize?: string
  complex?: boolean
  headsUp?: boolean
  page?: number
  setPage?: (p: number) => void
  pt?: boolean
  setLastPage?: (b: boolean) => void
  resetJam: () => void
  canImport?: boolean
  userId?: string
}

export default function Slides(p: SlidesProps) {
  useKeepAwake()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { width: w, height: h } = useWindowDimensions()

  const [slides, setSlides] = useState<OslynSlide>()
  const [requestedPage, _setPage] = useState(p.page || 0)
  const page = clampSlideIndex(requestedPage, slides?.pages.length || 0)
  const [transposedKey, setTransposedKey] = useState(p.skey || p.song.chordSheetKey || 'C')
  const [stage, setStage] = useState({ width: 0, height: 0 })
  const pageToken = `${page}|${p.song.songId}|${p.textSize}|${transposedKey}|${p.complex}`
  const [token, setToken] = useState(pageToken)
  const [maxWidth, setMaxWidth] = useState(0)
  const [blockH, setBlockH] = useState(0)
  if (token !== pageToken) {
    setToken(pageToken)
    setMaxWidth(0)
    setBlockH(0)
  }

  const setPage = (n: number) => { if (p.setPage) p.setPage(n); else _setPage(n) }
  useEffect(() => { _setPage(p.page || 0) }, [p.page])

  useEffect(() => {
    let baseKey = p.skey || p.song.chordSheetKey || 'C'
    if (p.transpose) baseKey = trans(baseKey, p.transpose) || 'C'
    setTransposedKey(baseKey)
  }, [p.transpose, p.skey, p.song.chordSheetKey])

  useEffect(() => {
    if (p.song.chordSheet && p.song.chordSheetKey) {
      setSlides(chordSheetToSlides(p.song.chordSheet, p.song.chordSheetKey || 'C'))
    } else {
      setSlides(undefined)
    }
  }, [p.song])

  const onMaxWidth = useCallback((measured: number) => {
    const rounded = acceptMeasuredWidth(0, measured)
    if (!rounded) return
    setMaxWidth((prev) => rounded > prev ? rounded : prev)
  }, [])

  const current = slides?.pages?.[page]
  const place = maxWidth > 0 && blockH > 0
    ? lyricPlacement(stage, { width: maxWidth, height: blockH })
    : { scale: 1, left: 0, top: 0 }
  const hasSheet = !!p.song.chordSheet?.trim()

  return <View style={{ width: w, height: h }}>
    <View
      pointerEvents="box-none"
      style={{
        paddingTop: insets.top + 8,
        paddingLeft: insets.left + 8,
        paddingRight: insets.right + 68,
        paddingBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 4,
        elevation: 4,
      }}
    >
      <Pressable accessibilityLabel="Close jam" onPress={p.resetJam} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={28} height={28} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#4c1d95">
          <Path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </Svg>
      </Pressable>
      {p.song.albumCover ? <Image source={{ uri: p.song.albumCover }} style={{ width: 72, height: 72, borderRadius: 8, marginRight: 12 }} /> : null}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={2} style={{ color: '#4b5563', fontWeight: '700', fontSize: 16 }}>{p.song.title}</Text>
        <Text numberOfLines={1} style={{ color: '#4b5563', fontSize: 12, marginTop: 2 }}>{p.song.artist}</Text>
      </View>
    </View>

    <View
      style={{ flex: 1, marginBottom: insets.bottom }}
      onLayout={(event) => {
        const box = layoutSize(event)
        const next = { width: Math.round(box.width), height: Math.round(box.height) }
        setStage((prev) => prev.width === next.width && prev.height === next.height ? prev : next)
      }}
    >
      {hasSheet && current && <View
        onLayout={(event) => { queueMeasuredHeight(event, setBlockH) }}
        style={{
          position: 'absolute',
          width: maxWidth || undefined,
          left: place.left,
          top: place.top,
          opacity: maxWidth > 0 && blockH > 0 && stage.width > 0 ? 1 : 0,
          transform: [{ scale: place.scale }],
        }}
      >
        {current.lines[0] && <Text style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic', fontWeight: '700' }}>{current.lines[0].section}</Text>}
        {current.lines.map((line, index) => (
          <Line key={index} onMaxWidth={onMaxWidth} phrase={line} skey={transposedKey} transpose={0} textSize={p.textSize || 'text-lg'} decorate={p.complex || false} loaded />
        ))}
        {p.headsUp && <View style={{ height: 24 }} />}
        {p.headsUp && current.extra && current.extra.section !== current.lines[0]?.section && (
          <Text style={{ color: '#6b7280', fontSize: 13, fontStyle: 'italic', fontWeight: '700' }}>{current.extra.section}</Text>
        )}
        {p.headsUp && current.extra && (
          <Line onMaxWidth={onMaxWidth} phrase={current.extra} skey={transposedKey} transpose={0} secondary textSize={p.textSize || 'text-lg'} decorate={p.complex || false} loaded />
        )}
      </View>}

      {!hasSheet && <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text, textAlign: 'center' }}>{p.song.title}</Text>
        {p.song.artist ? <Text style={{ marginTop: 8, color: colors.muted, textAlign: 'center' }}>{p.song.artist}</Text> : null}
        <Text style={{ marginTop: 16, color: colors.text, textAlign: 'center' }}>This song does not have a chord sheet yet.</Text>
        {p.canImport && p.userId ? <Pressable
          onPress={() => Linking.openURL(ultimateGuitarSearchUrl(p.song.title, p.song.artist))}
          style={{ marginTop: 20, backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12 }}
        >
          <Text style={{ color: colors.accentText, fontWeight: '700' }}>Import chords from Ultimate Guitar</Text>
        </Pressable> : null}
        {p.canImport ? <Text style={{ marginTop: 12, color: colors.muted, textAlign: 'center', fontSize: 12 }}>Opens a search in the browser. You can also paste a chart from the song menu.</Text> : null}
      </View>}
    </View>

    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, flexDirection: 'row', zIndex: 1 }}>
      {page > 0 ? <Pressable accessibilityLabel="Previous slide" onPress={() => setPage(page - 1)} style={{ flex: 1 }}>
        <LinearGradient colors={['rgba(95,40,212,0.5)', 'rgba(95,40,212,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, justifyContent: 'center', paddingLeft: insets.left + 8 }}>
          <Svg width={48} height={48} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#6b21a8">
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </Svg>
        </LinearGradient>
      </Pressable> : <View pointerEvents="none" style={{ flex: 1 }} />}
      {slides && slides.pages.length - 1 > page ? <Pressable accessibilityLabel="Next slide" onPress={() => setPage(page + 1)} style={{ flex: 1 }}>
        <LinearGradient colors={['rgba(95,40,212,0)', 'rgba(95,40,212,0.5)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end', paddingRight: insets.right + 8 }}>
          <Svg width={48} height={48} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#6b21a8">
            <Path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </Svg>
        </LinearGradient>
      </Pressable> : <View pointerEvents="none" style={{ flex: 1 }} />}
    </View>
  </View>
}
