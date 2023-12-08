import { chordSheetToSlides } from "oslyn-core/oslyn"
import { OslynSlide } from "oslyn-core/types"
import { Song } from "oslyn-src/API"
import { useEffect, useState } from "react"
import Line from "./line"

import { transpose as trans } from "oslyn-core/oslyn"
import {Text, View, Image, Pressable, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { useKeepAwake } from 'expo-keep-awake'
import Svg, { Path } from 'react-native-svg'
import Constants from 'expo-constants'
import { addOrientationChangeListener, lockAsync, Orientation, OrientationLock, removeOrientationChangeListener } from 'expo-screen-orientation'

interface SlidesProps {
  song: Song
  skey?: string

  transpose?: number
  textSize?: string
  complex?: boolean
  headsUp?: boolean

  /** page can be externalized / enable graphql call to sync pages */
  page?: number
  setPage?: (p: number) => void

  /** padding top */
  pt?: boolean

  /**  */
  setLastPage?: (b: boolean) => void
}

//const _STARTMAX = 500
export default function Slides(p: SlidesProps) {
  useKeepAwake()

  const [ slides, setSlides ] = useState<OslynSlide>()
  const [ page, _setPage ] = useState(p.page || 0) // dont use directly in html
  const [ transposedKey, setTransposedKey ] = useState(p.skey || p.song.chordSheetKey || "C")

  const setPage = (n: number) => { setMaxWidth(0); if (p.setPage) p.setPage(n); else _setPage(n) }
  useEffect(() => { setMaxWidth(0); _setPage(p.page || 0) }, [p.page])

  const [maxWidth, setMaxWidth] = useState(0)
  
  const [ w, setW ] = useState(Dimensions.get('window').width)
  const [ h, setH ] = useState(Dimensions.get('window').height)
  const [ o, setO ] = useState(Orientation.PORTRAIT_UP as Orientation)

  useEffect(() => { 
    // setW(Dimensions.get('window').width)
    // setH(Dimensions.get('window').height)

    changeScreenOrientation()
    const sub = addOrientationChangeListener((e) => {
      setO(e.orientationInfo.orientation || 0)
      setW(Dimensions.get('window').width)
      setH(Dimensions.get('window').height)
    })

    const sub2 = Dimensions.addEventListener('change', ({ window }) => {
      setH(window.height); setW(window.width)
    })

    return () => { removeOrientationChangeListener(sub); sub2?.remove() }
  }, [])

  const changeScreenOrientation = async () => {
    await lockAsync(OrientationLock.LANDSCAPE_LEFT)
  }

  useEffect(() => {
    let baseKey = p.skey || p.song.chordSheetKey || "C"
    if (p.transpose) baseKey = trans(baseKey, p.transpose) || "C"
    setTransposedKey(baseKey)
  }, [p.transpose, p.skey])

  useEffect(() => {
    console.log(p.song)
    if (p.song.chordSheet && p.song.chordSheetKey) {
      console.log(p.song.chordSheet)
      const oslynSlides = chordSheetToSlides(p.song.chordSheet, p.song.chordSheetKey || "C")
      console.log(oslynSlides)
      setSlides(oslynSlides)
    }
  }, [p.song])

  const onMaxWidth = (i: number) => {
    setMaxWidth((prev) => { 
      console.log(`prev: ${prev}, i: ${i} ==> max: ${Math.max(prev, i)}`)
      return Math.max(prev, i)
    })
  }

  

  return <>
    <View className="flex flex-row align-middle justify-center"
      style={{ height: h, width: w }}
    >
      <View className="flex-1 bg-blue-200" />
      <View className={`bg-purple-300`} style={{
        width: maxWidth ? maxWidth : w
      }}>
        { slides?.pages[page] && <View>
          { slides?.pages && slides?.pages[page]?.lines[0] && <Text className="text-gray-500 text-sm italic bold">
            {slides?.pages && slides?.pages[page].lines[0].section}
          </Text> }
          { slides?.pages && slides?.pages[page] && slides?.pages[page].lines.map((a, i) => 
            <Line key={i} onMaxWidth={onMaxWidth} phrase={a} skey={transposedKey} transpose={0} textSize={p.textSize || "text-lg"} decorate={p.complex || false}/>
          )}

          { p.headsUp && <View className="h-20" /> }

          { p.headsUp && slides?.pages[page] && slides?.pages[page].extra && slides?.pages[page].extra?.section != slides?.pages[page].lines[0].section && <Text className="text-gray-500 text-sm italic bold">
            {slides?.pages && slides?.pages[page].extra?.section}
          </Text> }
          { p.headsUp && slides?.pages && slides?.pages[page]?.extra && <View>
            <Line onMaxWidth={onMaxWidth} phrase={slides!.pages[page].extra!} skey={transposedKey} transpose={0} secondary textSize={p.textSize || "text-lg"} decorate={p.complex || false}/>
          </View> }
        </View> }

      </View>
      <View className="flex-1 bg-blue-200" />
    </View>

    {/* Buttons */}
    <View className="absolute top-0 left-0 ml-0 flex flex-row"
      style={{ height: h, width: w }}
    >
    { page > 0 ? <Pressable onPress={() => setPage(page-1)}>
        <LinearGradient colors={["rgba(95,40,212,0.5)", "rgba(95,40,212,0)" ]} start={{x: 0, y: 0}} end={{x:1, y:0}}>
          <View className={`pl-16 w-32 flex justify-center items-start`}
            style={{ 
              width: p.pt?(w/2)-90:w/2, 
              height: h //o <= 2 ? h : w
            }}
          >
            <View className="p-4 text-white w-16 h-16">
              <Svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="text-purple-800 w-16 h-16">
                <Path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </Svg>
            </View>
          </View>
        </LinearGradient>
      </Pressable> : <View style={{ width: p.pt?(w/2)-90:w/2, height: h }} /> }

      { slides && slides?.pages.length-1 > page ? <Pressable onPress={() => setPage(page+1)}>
        <LinearGradient colors={["rgba(95,40,212,0)", "rgba(95,40,212,0.5)"]} start={{x: 0, y: 0}} end={{x:1, y:0}} >
          <View className={`pr-16 w-32 flex justify-center items-end`}
            style={{ 
              width: p.pt?(w/2)-90:w/2, 
              height: h //o <= 2 ? h : w
            }}
          >
            <View className="p-4 text-white w-16 h-16">
              <Svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="text-purple-800 w-16 h-16">
                <Path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </Svg>
            </View>
          </View>
        </LinearGradient>
      </Pressable> : <View style={{ width: p.pt?(w/2)-90:w/2, height: h }} /> }

      { page < 8 && <View className={`absolute left-10 ${p.pt?"top-28":"top-3"} rounded-lg`}>
        <View className="flex flex-row hover:cursor-pointer">
          {p.song.albumCover && <Image source={{ uri: p.song.albumCover }} alt={p.song.album || ""} style={{width: 100, height: 100}} className="w-20 m-2"/> }
          <View className="m-2">
            <Text className="text-gray-500 bold">{p.song.title}</Text>
            <Text className="text-gray-600 text-xs">{p.song.artist}</Text>
          </View>
        </View>
      </View> }

    </View>
  </>
}

