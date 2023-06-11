"use client"

import awsConfig from '@/src/aws-exports'
import { Amplify, API, graphqlOperation } from 'aws-amplify'
import { GraphQLResult, GraphQLSubscription } from '@aws-amplify/api'

import * as s from '@/src/graphql/subscriptions'
import * as m from '@/src/graphql/mutations'
import { JamSession, NextPage, OnNextPageSubscription } from "@/src/API"
import Slides from "./slides"
import { useEffect, useState } from "react"

export interface PlayerProps {
  jam: JamSession
}
// http://localhost:3000/jam/8ad11bd9-a87d-47d2-949a-0512ed94b020
export default function Player(p: PlayerProps) {

  const [ song, setSong ] = useState(p.jam.setList.songs[p.jam.currentSong || 0]?.song)
  const [ sKey, setSKey ] = useState(p.jam.setList.songs[p.jam.currentSong || 0]?.key || "C")
  const [ page, setPage ] = useState(p.jam.currentPage || 0)

  useEffect(() => {
    Amplify.configure(awsConfig)
    if (p.jam.jamSessionId) { subscribeNextPage(p.jam.jamSessionId) }
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

        if (!page) { console.log("No page value found."); return }
        incomingNextPage(page)
      },
      error: (error) => console.error(error)
    })
    console.log(sub)
  }
  
  const incomingNextPage = async (page: number) => { setPage(page) }
  
  const setNextPage = async (page: number) => {
    Amplify.configure(awsConfig)

    const d = await API.graphql(graphqlOperation(m.nextPage, {
      jamSessionId: p.jam.jamSessionId, page
    })) as GraphQLResult<{ nextPage: NextPage }>
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
    setSong(p.jam.setList.songs[cp]!.song)
    setSKey(p.jam.setList.songs[cp]!.key)
    setPage(p.jam.currentPage || 0)
    console.log("all set")
  }, [p.jam])

  return <div className="text-white w-full h-screen flex flex-col">
    { song && <Slides song={song} skey={sKey} page={page} setPage={setNextPage} /> }
  </div>
}