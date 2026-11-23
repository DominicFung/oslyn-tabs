"use client"

import { EyeIcon } from "@heroicons/react/24/solid"
import Capo from "./capo"
import ChoiceRow from "./choiceRow"
import { SONG_KEYS, stepKey } from "./sessionSteps"

export interface KeyProps {
  skey?: string
  setKey?: (key: string) => void
  togglePreview?: () => void
  capo?: string
  setCapo?: (capo: string) => void
}

export default function Key(p: KeyProps) {
  const showKey = !!p.setKey && p.skey != null
  const showCapo = !!p.setCapo && p.capo != null

  return <>
    <div className="w-full min-w-0 max-w-full text-sm font-normal">
      {showKey && <>
        <div className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Key</div>
        <div className="pb-3 text-sm font-normal">Set the current song key for the entire team! <br /><span className="text-xs italic">Note: this affects everyone in the session.</span></div>
        <ChoiceRow
          value={p.skey!}
          options={SONG_KEYS}
          onChange={p.setKey!}
          onStep={(direction) => p.setKey!(stepKey(p.skey!, direction))}
          lowerLabel="Lower the key"
          raiseLabel="Raise the key"
        />
      </>}

      {showCapo && <div className={showKey ? "mt-8" : ""}>
        <Capo capo={p.capo!} setCapo={p.setCapo!} />
      </div>}

      { p.togglePreview && <div className="py-5">
        <button onClick={p.togglePreview}
          className="w-full flex flex-row text-white bg-oslyn-700 hover:bg-oslyn-800 focus:ring-4 focus:outline-none focus:ring-oslyn-300 font-medium rounded-lg text-sm px-5 py-0.5 text-center dark:bg-oslyn-600 dark:hover:bg-oslyn-700 dark:focus:ring-oslyn-800">
            <div className='flex-1' />
            <EyeIcon className="ml-10 m-2 w-6 h-6" />
            <div className="pr-10 py-2.5" >Toggle View</div>
            <div className='flex-1' />
        </button>
      </div> }
    </div>
  </>
}
