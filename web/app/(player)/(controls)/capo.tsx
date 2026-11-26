"use client"

import { useState } from "react"
import ChoiceRow from "./choiceRow"
import { CAPO_VALUES, stepCapo } from "./sessionSteps"

export interface CapoProps {
  capo: string
  setCapo: (capo: string) => void
}

export default function Capo(p: CapoProps) {
  const [ isLead, setIsLead ] = useState(false)
  const atMin = stepCapo(p.capo, -1) === p.capo
  const atMax = stepCapo(p.capo, 1) === p.capo

  return <>
    <div className="w-full min-w-0 max-w-full text-sm font-normal">
      <div className="pb-2 text-lg font-semibold text-gray-900 dark:text-white">Capo</div>
      <div className="pb-3 text-sm font-normal">Set your Capo to make chords easier to play!{" "}
        { !isLead && <span className="text-xs italic">(only affects you)</span> }
      </div>

      <ChoiceRow
        value={p.capo}
        options={CAPO_VALUES}
        onChange={p.setCapo}
        onStep={(direction) => p.setCapo(stepCapo(p.capo, direction))}
        lowerLabel="Lower the capo"
        raiseLabel="Raise the capo"
        lowerDisabled={atMin}
        raiseDisabled={atMax}
      />

      <div className="flex mt-10 mb-5">
        <div className="flex items-center h-5">
          <input id="helper-checkbox" aria-describedby="helper-checkbox-text" type="checkbox" value="" checked={isLead} onChange={() => setIsLead(!isLead)}
              className="w-4 h-4 text-oslyn-600 bg-gray-100 border-gray-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" />
        </div>
        <div className="ml-2 text-sm">
          <label htmlFor="helper-checkbox" className="font-medium text-gray-900 dark:text-gray-300">Lead Guarist?</label>
          <p id="helper-checkbox-text" className="text-xs font-normal text-gray-500 dark:text-gray-300">This will change the key for everyone else when you change the capo! <span className="text-xs italic">(Because you are the lead and you are all that matters. JK.)</span></p>
        </div>
      </div>
    </div>
  </>
}
