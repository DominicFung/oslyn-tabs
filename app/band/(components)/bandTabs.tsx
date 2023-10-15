"use client"

import { Band } from "@/src/API"
import { useBandContext } from "../context"

interface BandTabsProps {
  bands: Band[]
}

export default function BandTabs(p: BandTabsProps) {
  const { setIndex } = useBandContext()

  return <>
  <div className="mx-2"></div>
    {p.bands.map( (b, i) =>
      <button key={i} type="submit" onClick={() => setIndex(i)}
          className="text-white mx-1 my-2 bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-md text-sm pr-4 py-2 pl-2 dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800 flex flex-row">
        <img className="mr-2 w-5 h-5 rounded-sm" src={b.imageUrl||""} alt="product image" />
        <span>{b.name}</span>
      </button>
    )}
  </>
}