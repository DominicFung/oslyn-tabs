"use client"

import { BandRequest } from "@/app/api/band/create/route"
import { Band } from "@/src/API"
import { InboxArrowDownIcon } from "@heroicons/react/24/solid"
import { useRouter } from "next/navigation"

export interface SaveProps {
  band: Band,
  type: "create" | "update"
}

export default function Save(p: SaveProps) {
  const router = useRouter()

  const updateSet = async () => {
    if (!p.band?.bandId) { console.error("bandId not available"); return }
    if (!p.band.description || !p.band.name) { console.error("name and description not available"); return }

    const data = await (await fetch(`/api/band/${p.band?.bandId}/update`, {
      method: "POST",
      body: JSON.stringify(p.band as BandRequest)
    })).json() as Band
    console.log(data)
    router.push(`/band`)
  }

  const createSet = async () => {
    if (!p.band.description || !p.band.name || !p.band.imageUrl) { console.error("name, description or imageUrl not available"); return }

    const data = await (await fetch(`/api/band/create`, {
      method: "POST",
      body: JSON.stringify({
        name: p.band.name,
        description: p.band.description, 
        imageUrl: p.band.imageUrl
      } as BandRequest)
    })).json() as Band
    console.log(data)
    router.push(`/band`)
  }

  return <>
    <button onClick={() => { p.type === "create" ? createSet() : updateSet()  }}
      className="fixed z-90 bottom-10 right-8 bg-coral-400 w-16 h-16 rounded-full p-4 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl disabled:bg-gray-600 disabled:text-gray-800 text-oslyn-800 hover:text-oslyn-900"
      disabled={p.band.description === "" || p.band.name === "" || p.band.imageUrl === ""}
    >
      <InboxArrowDownIcon className="w-8 h-8" />
    </button>
  </>

}