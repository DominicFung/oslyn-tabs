import Image from "next/image"

import { Song } from "@/../src/API"
import KeySelector from "./keySelector"
import Review from "../../(edit)/review"
import { useState } from "react"

interface PreviewProps {
  song: Song
  toggleView: () => void
}

export default function Preview(p: PreviewProps) {

  const [ k, setK ] = useState(p.song.chordSheetKey || "C")

  return <>
    <section className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
      <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 z-10 relative">
          <Image src={p.song.albumCover || ""} alt={""} width={192} height={192} className="w-48 m-2 mx-auto" />
          <div className="mt-6">
            <h1 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl lg:text-5xl dark:text-gray-100">{p.song.title}</h1>
            <p className="mb-4 text-lg font-normal text-gray-500 lg:text-lg dark:text-oslyn-300">
              {p.song.artist} - {p.song.album}
            </p>
          </div>
      </div>
      <div className="bg-gradient-to-b from-oslyn-50 to-transparent dark:from-oslyn-900 w-full h-full absolute top-0 left-0 z-0"></div>
    </section>
    <div>
      {p.song && <KeySelector sKey={k} setSKey={setK} toggleView={p.toggleView} />}
    </div>
    <div className='mt-12 mx-auto max-w-xl'>
      {p.song && <Review song={p.song} skey={k} /> }
    </div>
  </>
}