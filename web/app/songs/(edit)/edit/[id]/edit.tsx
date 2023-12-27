"use client"

import { Song } from "@/../src/API"
import { useEffect, useState } from "react"
import PasteTabs from "../../pasteTabs"
import SongInfo from "../../songInfo"

import Slides from "@/app/(player)/slides"
import Save from "../../(components)/save"
import Tabs from "../../(components)/tabs"

import { useSearchParams } from "next/navigation"

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
  const searchParams = useSearchParams()
  const [ step, setStep ] = useState(0)
  const [ song, setSong ] = useState(p.song)

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
    const cs = await (await fetch(`/api/song/${id}/clean/chordsheet`)).json()
    console.log(`NEW CHORD SHEET`)
    console.log(cs)
    if (cs.choices[0]) {
      if (cs.choices[0].message.content) 
        setSong((song) => { 
          return {...song, chordSheet: cs.choices[0].message.content}
        })
    }
  }

  useEffect(() => {
    console.log("in useEffect")
    if (searchParams.get("new") != "true") return
    if (!song.title || !song.artist || !song.songId) return
    searchSpotify(song.title, song.artist)
    cleanChordSheet(song.songId)
  }, [])

  return <div className="text-white w-full h-screen flex flex-col">
    <div className="flex-0">
      <Tabs step={step} setStep={setStep}  />
    </div>
    
    <div className="flex-1 p-4">
      { step === 0 && <PasteTabs tabs={song.chordSheet || ""} setTabs={(t: string) => { console.log(t); setSong({ ...song, chordSheet: t }) }} /> }
      { step === 1 && <SongInfo song={song} setSong={setSong} searchSpotify={searchSpotify}/>}
      { step === 2 && <Slides song={song} pt={true} /> }
    </div>
    <Save song={song} type="update"/>
  </div>
}