"use client"

import { Band, User, Song } from "@/../src/API"
import { useEffect, useState } from "react"
import BandInfo from "./(components)/bandInfo"
import Save from "./(components)/save"
import { useBandContext } from "./context"
import SongTable from "@/app/(components)/(song)/songTable"
import ShareSongs from "./(components)/share"
import Link from "next/link"

interface BandsProps {
  user: User
  bands: Band[]
  songs: Song[]
}

export default function Bands(p: BandsProps) {
  const { index } = useBandContext()
  const [band, setBand] = useState<Band | undefined>(p.bands?.[0])

  useEffect(() => {
    if (p.bands && p.bands.length > index && p.bands[index]) setBand(p.bands[index])
    else setBand(undefined)
  }, [p.bands, index])

  if (!p.bands || p.bands.length === 0 || !band) {
    return (
      <div className="m-8 mx-auto max-w-xl text-center">
        <p className="text-lg font-medium text-gray-800 dark:text-gray-100">You don&apos;t have any bands yet.</p>
        <p className="mt-2 text-gray-500 dark:text-gray-400">Create a band to organize your friends and songs.</p>
        <Link href="/bands/create" className="inline-block mt-4 text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
          Create a band
        </Link>
      </div>
    )
  }

  return <>
    <div className='m-5 grid grid-cols-2 2xl:grid-cols-3 gap-4'>
      <div className="col-span-1">
        <BandInfo band={band} setBand={setBand}/>
      </div>

      { band.songs && <div className="2xl:col-span-2">
        <ShareSongs user={p.user} band={band} songs={p.songs}/>
        <SongTable user={p.user} songs={band.songs as Song[] || []} type={"own"} />
      </div> }
    </div>

    <Save band={band} type="create" />
  </>
}
