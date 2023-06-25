"use client"

import { SetRequest } from "@/app/api/set/create/route"
import { JamSongInput, SetList } from "@/src/API"
import { InboxArrowDownIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"

export interface SaveProps {
  set: SetList,
  type: "create" | "update"
}

export default function Save(p: SaveProps) {
  const router = useRouter()

  const updateSet = async () => {
    if (!p.set?.setListId) { console.error("setListId not available"); return }

    if (!p.set.description || !p.set.songs) { console.error("title and key not available"); return }

    const jamsongs = p.set.songs.map(a => { 
      return { songId: a?.song.songId, key: a?.key } as JamSongInput
    })

    const data = await (await fetch(`/api/set/${p.set?.setListId}/update`, {
      method: "POST",
      body: JSON.stringify({
        ...p.set, songs: jamsongs
      } as SetRequest)
    })).json() as SetList
    console.log(data)
  }

  const createSet = async () => {
    if (!p.set.description || !p.set.songs) { console.error("title and key not available"); return }

    const jamsongs = p.set.songs.map(a => { 
      return { songId: a?.song.songId, key: a?.key } as JamSongInput
    })

    const data = await (await fetch(`/api/set/create`, {
      method: "POST",
      body: JSON.stringify({
        description: p.set.description, 
        songs: jamsongs
      } as SetRequest)
    })).json() as SetList
    console.log(data)

    router.push(`/sets`)
  }

  return <>
    <button onClick={() => { p.type === "create" ? createSet() : updateSet()  }}
      className="fixed z-90 bottom-10 right-8 bg-coral-400 w-16 h-16 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl disabled:bg-gray-600 disabled:text-gray-800 text-oslyn-800 hover:text-oslyn-900"
      disabled={p.set.description === "" || p.set.songs.length === 0}
    >
      <InboxArrowDownIcon className="w-8 h-8" />
    </button>
  </>

}