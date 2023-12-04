import { JamSession, User, Participant, JamSong } from "@src/API"
import { useEffect, useState } from 'react'
import { View } from 'react-native'

import { default as PSlides } from "./slides"
import { default as SSlides } from '../(slides)/slides'

import AsyncStorage from '@react-native-async-storage/async-storage'

import { Amplify, API } from 'aws-amplify';
import { GraphQLSubscription } from '@aws-amplify/api'
import * as s from '@src/graphql/subscriptions'
import awsConfig from '@src/aws-exports';
Amplify.configure({
  API: { 
    GraphQL: {  
      endpoint: awsConfig.aws_appsync_graphqlEndpoint,
      region: awsConfig.aws_appsync_region,
      apiKey: awsConfig.aws_appsync_apiKey,
      defaultAuthMode: "apiKey"
    } 
  }
});

export interface PlayerProps {
  jam: JamSession, 
  isSlideShow?: boolean
  user: User|null
}

export default function Player(p: PlayerProps) {

  // these are being SUBSCRIBED to, so needs to be moved out of the main JAM object.
  const [ song, setSong ] = useState(p.jam.currentSong || 0)
  const [ sKey, setSKey ] = useState(p.jam.setList.songs[p.jam.currentSong || 0]?.key || "C")
  const [ page, setPage ] = useState(p.jam.currentPage || 0)
  const [ active, setActive ] = useState<Participant[]>([])
  const [ songs, setSongs ] = useState<JamSong[]>([])

  const [ isLastPage, setLastPage ] = useState(false)

  const [transpose, setTranspose] = useState(0)
  const setCapo = (c: string) => { setTranspose(0-Number(c)) }

  const [ textSize, setTextSize ] = useState("text-lg")
  useEffect(() => { 
    (async () => {
      const a = await AsyncStorage.getItem('jam/textSize') || "text-lg"; 
      if (a && a != "false") { setTextSize(a) } 
    })()
  }, [])
  useEffect(() => { AsyncStorage.setItem('jam/textSize', textSize) }, [textSize])

  const [ complex, setComplex ] = useState(true)
  useEffect(() => {
    (async () => {
      const a = await AsyncStorage.getItem('jam/complex') || "true"; 
      if (a) { setComplex(a === "true") }
    })()
  }, [])
  useEffect(() => { AsyncStorage.setItem('jam/complex', JSON.stringify(complex)) }, [complex])

  const [ headsUp, setHeadsUp ] = useState(false)
  useEffect(() => { 
    (async () => {
      const a = await AsyncStorage.getItem('jam/headsUp') || "false"; 
      if (a) { setHeadsUp(a === "true") } 
    })()
  }, [])
  useEffect(() => { AsyncStorage.setItem('jam/headsUp', JSON.stringify(headsUp)) }, [headsUp])

  const [ slideTextSize, setSlideTextSize ] = useState(p.jam.slideTextSize || "text-3xl")
  useEffect(() => {
    console.log("subscribe text size")
    if (p.jam.jamSessionId && p.isSlideShow) { subscribeTextSize(p.jam.jamSessionId) }
  }, [p.isSlideShow, p.jam.jamSessionId])

  const subscribeTextSize = async (jamSessionId: string): Promise<ZenObservable.Subscription> => {
    const sub = API.graphql<GraphQLSubscription<OnJamSlideConfigChangeSubscription>>(
      graphqlOperation(s.onJamSlideConfigChange, { jamSessionId } )
    ).subscribe({
      next: ({ value }) => {
        const ts = value.data?.onJamSlideConfigChange?.textSize
        console.log(ts)
        setSlideTextSize(ts || "text-3xl")
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
    return sub
  }

  const setNextPage = async (page: number) => { /* TODO: GraphQL */ }
  const setNextSong = async (song: number) => { /* TODO: GraphQL */ }
  const setKey = async (key: string) => { /* TODO: GraphQL */ }

  return <View className={`text-white w-full h-screen flex flex-col overflow-hidden`} id="player">
    { songs[song]?.song && 
      (p.isSlideShow ? 
        <SSlides
          song={songs[song].song} page={page} 
          setPage={setNextPage} setLastPage={setLastPage}
          textSize={slideTextSize || "text-3xl"}
        />:
        <PSlides 
          song={songs[song]!.song} skey={sKey} page={page} 
          setPage={setNextPage} setLastPage={setLastPage} transpose={transpose} 
          textSize={textSize} complex={complex} headsUp={headsUp}
        />)
    }
    </View>
}