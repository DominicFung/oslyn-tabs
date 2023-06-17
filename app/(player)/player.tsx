"use client"

import awsConfig from '@/src/aws-exports'
import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult, GraphQLSubscription } from '@aws-amplify/api'

import * as s from '@/src/graphql/subscriptions'
import * as m from '@/src/graphql/mutations'
import { JamSession, JamSong, NextKey, NextPage, OnNextPageSubscription, OnNextSongSubscription, OnSongKeySubscription, Song } from "@/src/API"
import Slides from "./slides"
import { useEffect, useState } from "react"
import { ChevronDoubleRightIcon } from '@heroicons/react/24/solid'
import Controls from './controls'

export interface PlayerProps {
  jam: JamSession
}

Amplify.configure({ ...awsConfig, ssr: true });

// http://192.168.68.128:3000/jam/95b1a549-127f-4a38-96c4-8dabfbb35bc1
export default function Player(p: PlayerProps) {

  const [ song, setSong ] = useState(p.jam.currentSong || 0)
  const [ sKey, setSKey ] = useState(p.jam.setList.songs[p.jam.currentSong || 0]?.key || "C")
  const [ page, setPage ] = useState(p.jam.currentPage || 0)

  const [ isLastPage, setLastPage ] = useState(false)

  const [transpose, setTranspose] = useState(0)
  const setCapo = (c: string) => { setTranspose(0-Number(c)) }

  const [ textSize, setTextSize ] = useState("text-lg")

  useEffect(() => {
    if (p.jam.jamSessionId) { 
      subscribeNextPage(p.jam.jamSessionId)
      subscribeNextSong(p.jam.jamSessionId)
      subscribeKeyChange(p.jam.jamSessionId)
    }
  }, [page, p.jam.jamSessionId])

  const subscribeNextPage = async (jamSessionId: string) => {
    const sub = API.graphql<GraphQLSubscription<OnNextPageSubscription>>(
      graphqlOperation(s.onNextPage, { jamSessionId } )
    ).subscribe({
      next: ({provider, value}) => {
        console.log("=== On Next Page ===")
        console.log(JSON.stringify(provider))
        console.log(JSON.stringify(value))

        const page = value.data?.onNextPage?.page
        console.log(page)
        incomingNextPage(page || 0)
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
  }

  const subscribeNextSong = async (jamSessionId: string) => {
    const sub = API.graphql<GraphQLSubscription<OnNextSongSubscription>>(
      graphqlOperation(s.onNextSong, { jamSessionId } )
    ).subscribe({
      next: ({provider, value}) => {
        console.log("=== On Next Song ===")
        console.log(JSON.stringify(provider))
        console.log(JSON.stringify(value))

        const song = value.data?.onNextSong?.song
        const page = value.data?.onNextSong?.page

        if (!song) { console.log(`No song index value found, this can be OK. ${song}`) }
        if (!page) { console.log(`No page value found, this can be OK. ${page}`) }

        incomingNextSong(song||0, page||0)
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
  }

  const subscribeKeyChange = async (jamSessionId: string) => {
    const sub = API.graphql<GraphQLSubscription<OnSongKeySubscription>>(
      graphqlOperation(s.onSongKey, { jamSessionId } )
    ).subscribe({
      next: ({provider, value}) => {
        console.log("=== On Key Change ===")
        console.log(JSON.stringify(provider))
        console.log(JSON.stringify(value))

        const song = value.data?.onSongKey?.song
        const key = value.data?.onSongKey?.key

        if (!song) { console.log(`No song index value found, this can be OK. ${song}`) }
        if (!key) { console.log(`No page value found, this can be OK. ${page}`) }

        incomingKey(song||0, key || "C")
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
  }
  
  const incomingNextPage = async (page: number) => { setPage(page) }
  const incomingNextSong = async (song: number, page: number) => { setSong(song); setPage(page) }
  const incomingKey = async (s: number, key: string) => {
    if (song === s) { setSKey(key) } 
    else { console.error("TODO: handle case where we are modifying NOT current song's key.") }
  }
  
  const setNextPage = async (page: number) => {
    const d = await API.graphql(graphqlOperation(m.nextPage, {
      jamSessionId: p.jam.jamSessionId, page
    })) as GraphQLResult<{ nextPage: NextPage }>
    console.log(d)
  }

  const setNextSong = async (song: number) => {
    if (p.jam.setList.songs.length > song) {
      const d = await API.graphql(graphqlOperation(m.nextSong, {
        jamSessionId: p.jam.jamSessionId, song
      })) as GraphQLResult<{ nextPage: NextPage }>
      console.log(d)
    } else { console.error(`Error: next song index "${song}" is greater than setlist.length "${p.jam.setList.songs.length}"`) }
  }

  const setKey = async (key: string) => {
    const d = await API.graphql(graphqlOperation(m.setSongKey, {
      jamSessionId: p.jam.jamSessionId, song, key
    })) as GraphQLResult<{ setSongKey: NextKey }>
    console.log(d)
  }
  
  useEffect(() => {
    if (!p.jam || p.jam.currentSong! <= -1 || p.jam.currentSong! >= p.jam.setList.songs.length) { 
      console.warn(`currentSong not within range of setList: ${p.jam.currentPage}`); return 
    }
    const cp = p.jam.currentSong!
    if (!p.jam || p.jam.currentPage! <= -1) { 
      console.warn(`currentPage not > 1. ${p.jam.currentPage}`); return 
    }

    if (!p.jam.setList.songs[cp]) { console.error(`song in setlist at ${cp} not found`); return }
    setSong(cp)
    setSKey(p.jam.setList.songs[cp]!.key)
    setPage(p.jam.currentPage || 0)
    console.log("all set")
  }, [p.jam])

  return <div className="text-white w-full h-screen flex flex-col">
    { p.jam.setList.songs[song]?.song && 
      <Slides song={p.jam.setList.songs[song]!.song} skey={sKey} page={page} setPage={setNextPage} setLastPage={setLastPage} transpose={transpose} textSize={textSize}/> 
    }
    { isLastPage && p.jam.setList.songs.length > song+1 && <button onClick={() => setNextSong(song+1)}
        className='fixed bottom-4 right-10 bg-gray-50 dark:bg-gray-700 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300'
      >
        <ChevronDoubleRightIcon className="w-6 h-6 text-white" />
    </button> }
    { p.jam.setList.songs && 
      <Controls 
        capo={{ capo:`${0-transpose}`, setCapo }} 
        song={{ song, setSong: setNextSong, songs: p.jam.setList.songs as JamSong[] }} 
        sKey={{ skey: sKey, setKey }}
        text={{ textSize, setTextSize, auto: false, setAuto: () => {} }}
      /> 
    }
  </div>
}