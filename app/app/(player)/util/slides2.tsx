import { chordSheetToSlides } from "oslyn-core/oslyn"
import { OslynSlide } from "oslyn-core/types"
import { Song } from "oslyn-src/API"
import { useEffect, useState } from "react"
import Line from "./line2"

import { transpose as trans } from "oslyn-core/oslyn"
import { Text, View, Image, Pressable, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { useKeepAwake } from 'expo-keep-awake'
import Svg, { Path } from 'react-native-svg'

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

const maxWidthToTailwindMap = [
  { upTo: 384, name: "max-w-sm" },
  { upTo: 448, name: "max-w-md" },
  { upTo: 512, name: "max-w-lg"},
  { upTo: 576, name: "max-w-xl" },
  { upTo: 640, name: "max-w-screen-sm" },
  { upTo: 768, name: "max-w-screen-md" },
  { upTo: 1024, name: "max-w-screen-lg" },
  { upTo: 1280, name: "max-w-screen-xl" },
  {  upTo: 1536, name: "max-w-screen-2xl" },
]

export default function Slides(p: SlidesProps) {
  useKeepAwake()
  
  const [ slides, setSlides ] = useState<OslynSlide>()
  const [ page, _setPage ] = useState(p.page || 0) // dont use directly in html
  const [ transposedKey, setTransposedKey ] = useState(p.skey || p.song.chordSheetKey || "C")

  const [ chordWidths, setChordWidths ] = useState<number[][]>([])

  const setPage = (n: number) => {
    if (p.setPage) p.setPage(n)
    else _setPage(n)
  }

  useEffect(() => {
    _setPage(p.page || 0)
  }, [p.page])

  useEffect(() => {
    let baseKey = p.skey || p.song.chordSheetKey || "C"
    if (p.transpose) baseKey = trans(baseKey, p.transpose) || "C"
    setTransposedKey(baseKey)
  }, [p.transpose, p.skey])

  const [ wClass, setWClass ] = useState("max-w-screen-sm")
  const [ screen, setScreen ] = useState({ w: 300, h: 300 }) 

  useEffect(() => {
    setScreen({
      w: Dimensions.get('window').width || 300, 
      h: Dimensions.get('window').height || 300
    })
    const subscription = Dimensions.addEventListener(
      'change',
      ({window}) => {
        setScreen({w: window.width, h: window.height});
      },
    );
    return () => subscription?.remove()
  }, [])

  useEffect(() => {
    if (p.setLastPage) {
      if (slides?.pages && slides.pages.length-1 === page) {
        p.setLastPage(true)
      } else p.setLastPage(false)
    }
  }, [p.setLastPage, page, slides])
  
  useEffect(() => {
    console.log(p.song)
    if (p.song.chordSheet && p.song.chordSheetKey) {
      console.log(p.song.chordSheet)
      const oslynSlides = chordSheetToSlides(p.song.chordSheet, p.song.chordSheetKey || "C")
      console.log(oslynSlides)
      setSlides(oslynSlides)
    }
  }, [p.song])

  useEffect(() => {
    if (slides && slides.pages[page]) {
      const a = slides.pages[page].lines.map((a) => a.lyric)
      if (slides.pages[page].extra) { a.push(slides.pages[page].extra?.lyric!) }
      
      (async () => { 
        const w = await calcMaxWidthTailwindClass(a)
        console.log(w)
        setWClass(w)
      })()
    }
  }, [slides, page])

  return <View>
    <View className={`flex justify-center items-center h-full m-auto ${wClass}`}>
      { !slides?.pages[page] && <Text className="text-white">Sorry something went wrong. Click on the gear, and select a new song to reset the system.</Text> }
      { slides?.pages[page] && <View>
        { slides?.pages && slides?.pages[page]?.lines[0] && <Text className="text-gray-500 text-sm italic bold">
          {slides?.pages && slides?.pages[page].lines[0].section}
        </Text> }
        { slides?.pages && slides?.pages[page] && slides?.pages[page].lines.map((a, i) => <View key={i} >
          <Line key={i} phrase={a} skey={transposedKey} transpose={0} textSize={p.textSize || "text-lg"} decorate={p.complex || false}/>
        </View>)}

        <View className="h-20" />

        { p.headsUp && slides?.pages[page] && slides?.pages[page].extra && slides?.pages[page].extra?.section != slides?.pages[page].lines[0].section && <Text className="text-gray-500 text-sm italic bold">
          {slides?.pages && slides?.pages[page].extra?.section}
        </Text> }
        { p.headsUp && slides?.pages && slides?.pages[page]?.extra && <View>
          <Line phrase={slides!.pages[page].extra!} skey={transposedKey} transpose={0} secondary textSize={p.textSize || "text-lg"} decorate={p.complex || false}/>
        </View> }
      </View> }
    </View>
    <View className={`absolute bottom-0 left-0 ml-0 w-full flex flex-row`}>
      { /*page > 0 ? <Pressable className="flex-1" onPress={() => setPage(page-1)}>
        <View className={`w-32 flex justify-center items-center ${p.pt?"h-[calc(100%-90px)]":"h-screen"}`}>
          <LinearGradient colors={["rgba(95,40,212,0.5)", "rgba(95,40,212,0)" ]} start={{x: 0, y: 0}} end={{x:1, y:0}}>
            <View className="p-4 text-white w-4 h-4">
              <Svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4">
                <Path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </Svg>
            </View>
          </LinearGradient>
        </View>
        </Pressable> : <View className="flex-1" /> */}
      { /*slides && slides?.pages.length-1 > page ? <Pressable className="flex-1 flex flex-row-reverse" onPress={() => setPage(page+1)}>
        <View className={`w-24 flex justify-center items-center ${p.pt?"h-[calc(100%-90px)]":"h-screen"}`}>
          <LinearGradient colors={["rgba(95,40,212,0)", "rgba(95,40,212,0.5)"]} start={{x: 0, y: 0}} end={{x:1, y:0}} >
            <View className="w-4 h-4 p-4 text-white">
              <Svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="w-4 h-4">
                <Path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </Svg>
            </View>
          </LinearGradient>
        </View>
        </Pressable> : <View className="flex-1" /> */}
    </View>
    {page === 0 && <View className={`absolute left-10 ${p.pt?"top-28":"top-3"} rounded-lg`}>
      <View className="flex flex-row hover:cursor-pointer">
        {p.song.albumCover && <Image source={{ uri: p.song.albumCover }} alt={p.song.album || ""} style={{width: 200, height: 200}} className="w-20 m-2"/> }
        <View className="m-2">
          <Text className="text-gray-500 bold">{p.song.title}</Text>
          <Text className="text-gray-600 text-xs">{p.song.artist}</Text>
        </View>
      </View>
    </View>}

  </View>
}

const calculateWidth = async (t: string, fontSize: string = "text-lg") => {
  let f = 18
  switch(fontSize) {
    case "text-xs":   f=12; break;
    case "text-sm":   f=14; break;
    case "text-base": f=16; break;
    case "text-lg":   f=18; break;
    case "text-xl":   f=20; break;
    case "text-2xl":  f=24; break;
    case "text-3xl":  f=30; break;
    case "text-4xl":  f=36; break;
    case "text-5xl":  f=48; break;
    case "text-6xl":  f=60; break;
    case "text-7xl":  f=72; break;
    case "text-8xl":  f=96; break;
    case "text-9xl":  f=128; break;
  }
  
  // let i = await rnTextSize.measure({ text: t, fontSize: f })
  // return i.width
  return 0
}

export const calcMaxWidthTailwindClass = async (text: string[]): Promise<string> => {
  let w = "max-w-sm"
  let cMax = 0
  for (let i = 0; i < text.length; i++) {
    let width = await calculateWidth(text[i])
    if (width > cMax) { cMax = width }
  }
  console.log(cMax)

  for (let i = 0; i < maxWidthToTailwindMap.length; i++) {
    if (cMax < maxWidthToTailwindMap[i].upTo) { break }
    w = maxWidthToTailwindMap[i].name
  }
  return w
}