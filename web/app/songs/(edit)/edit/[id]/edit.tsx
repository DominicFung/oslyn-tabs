"use client"

import { Song } from "@/../src/API"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import PasteTabs from "../../pasteTabs"
import SongInfo from "../../songInfo"
import Review from "../../review"

import Save from "../../(components)/save"
import Tabs from "../../(components)/tabs"

import { useSearchParams } from "next/navigation"
import { SongUpdateRequest } from "@/app/api/song/[id]/update/route"

import Revert from "../../(components)/revert"

export interface EditProps {
  song: Song
}

interface SpotifyTracks {
  tracks: {
    items: {
      album: {
        name: string
        images: {
          height: number, url: string
        }[]
      }
    }[]
  }
}

export default function Edit(p: EditProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [ step, setStep ] = useState(0)
  const [ song, setSong ] = useState(p.song)

  const [ oldChordSheet, setOldChordSheet ] = useState("")
  const [ loading, setLoading ] = useState(false)

  const searchSpotify = async (title: string, artist: string) => {
    if (!title || !artist) return
    const { tracks } = await (await fetch(`/api/spotify`, {
      method: "POST", 
      body: JSON.stringify({ title, artist })
    })).json() as SpotifyTracks

    console.log(tracks.items)
    if (tracks.items.length < 1) return
    const album = tracks.items[0].album

    setSong((song) => {
      let s = { ...song }
      if (!song.album) s.album = album.name
      if (!song.albumCover) s.albumCover = album.images[0].url
      return s
    })
  }

  const cleanChordSheet = async (id: string) => {
    setLoading(true)
    let cs:any = null
    
    try {
      cs = await (await fetch(`/api/song/${id}/clean/chordsheet`)).json()
    } catch(e) {
      console.error(e)
      setLoading(false)
      return
    }
    
    console.log(`NEW CHORD SHEET`)
    console.log(cs)
    if (cs.choices[0]) {
      if (cs.choices[0].message.content) 
        setSong((song) => { 
          setLoading(false)
          const content = cs.choices[0].message.content as string
          setOldChordSheet(song.chordSheet || "")
          if (content.length < 20 && content.toLowerCase().includes("no change")) {
            return song
          } else return {...song, chordSheet: content}
        })
    }
  }

  const addSpacesAtEnd = () => {
    let cs = (song.chordSheet || "").replace(/[\r\n]+/g, "  \n")
    setSong({...song, chordSheet: cs})
  }

  const setChordSheet = async (chordSheet: string) => {
    setSong((prev) => { return { ...prev, chordSheet } })
    setOldChordSheet("")
  }

  useEffect(() => {
    console.log("in useEffect")
    if (searchParams.get("new") != "true") return
    if (!song.title || !song.artist || !song.songId) return

    window.history.pushState({}, "", `/songs/edit/${song.songId}`)
    searchSpotify(song.title, song.artist)
    //cleanChordSheet(song.songId)
    addSpacesAtEnd()
  }, [p.song])

  return <div className="text-white w-full h-screen flex flex-col">
    <div className="flex-0">
      <Tabs step={step} setStep={setStep}  />
    </div>
    
    <div className="flex-1 p-4">
      { step === 0 && <PasteTabs tabs={song.chordSheet || ""} setTabs={(t: string) => { console.log(t); setSong({ ...song, chordSheet: t }) }} /> }
      { step === 1 && <SongInfo song={song} setSong={setSong} searchSpotify={searchSpotify}/>}
      { step === 2 && <Review song={song} /> }
    </div>
    <Save song={song} type="update" loading={loading}/>
    <Revert oldChordSheet={oldChordSheet} newChordSheet={p.song.chordSheet||""} setChordSheet={setChordSheet} />
  </div>
}