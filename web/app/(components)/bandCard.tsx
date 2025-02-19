"use client"

import { Band } from "@/../src/API"
import Image from "next/image"

interface BandCardProps {
  band: Band
}

export default function BandCard(p: BandCardProps) {
  return <div className="bg-white border w-full border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
  <a href={`/bands/${p.band.bandId}`}>
      <Image className="p-4 rounded-t-lg" src={p.band.imageUrl||""} width={500} height={500} alt="product image" unoptimized/>
  </a>
  <div className="px-4 pb-4 w-full">
    <div className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white truncate">{p.band.name}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap truncate">{p.band.description}</div>
  </div>
</div>
}