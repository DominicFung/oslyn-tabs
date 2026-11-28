'use client'

import { useEffect, useState } from 'react'

export const SMARTER_KEY = 'jam/followSmarter'
export const ASR_MODEL_KEY = 'jam/followAsr'

export default function FollowListening() {
  const [on, setOn] = useState(false)
  const [model, setModel] = useState<'tiny' | 'base'>('tiny')

  useEffect(() => {
    setOn(localStorage.getItem(SMARTER_KEY) === 'true')
    setModel(localStorage.getItem(ASR_MODEL_KEY) === 'base' ? 'base' : 'tiny')
  }, [])

  const publish = () => window.dispatchEvent(new Event('follow-smarter'))

  const toggle = () => {
    const next = !on
    setOn(next)
    localStorage.setItem(SMARTER_KEY, next ? 'true' : 'false')
    publish()
  }

  const choose = (next: 'tiny' | 'base') => {
    setModel(next)
    localStorage.setItem(ASR_MODEL_KEY, next)
    publish()
  }

  return <div className="space-y-3 text-gray-800 dark:text-gray-100">
    <label className="flex items-start gap-3">
      <input type="checkbox" className="mt-1" checked={on} onChange={toggle} />
      <span>
        <span className="font-semibold">Smarter listening (beta): use lyrics and past takes</span>
        <span className="mt-1 block text-sm text-gray-500 dark:text-gray-400">Off by default. When on, a page turns only if the chords agree with the lyrics or with your earlier takes of this song. You can also say “next” or “back”.</span>
      </span>
    </label>
    <label className="block text-sm">
      Speech model
      <select
        className="mt-1 block w-full rounded border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-900"
        value={model}
        onChange={(event) => choose(event.target.value === 'base' ? 'base' : 'tiny')}
      >
        <option value="tiny">Tiny (lighter)</option>
        <option value="base">Base (slower)</option>
      </select>
    </label>
  </div>
}
