"use client"

import { ArrowsUpDownIcon } from "@heroicons/react/24/solid"
import { Listbox, Transition } from '@headlessui/react'

export interface ChoiceRowProps {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  onStep: (direction: -1 | 1) => void
  lowerLabel: string
  raiseLabel: string
  lowerDisabled?: boolean
  raiseDisabled?: boolean
}

const stepButton = "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-gray-50 text-lg leading-none text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"

export default function ChoiceRow(p: ChoiceRowProps) {
  return (
    <div className="flex w-full min-w-0 max-w-full items-center gap-2">
      <button type="button" aria-label={p.lowerLabel} disabled={p.lowerDisabled} onClick={() => p.onStep(-1)} className={stepButton}>
        −
      </button>
      <Listbox as="div" value={p.value} onChange={p.onChange} className="relative min-w-0 flex-1">
        {({ open }) => (
          <>
            <Listbox.Button className="relative flex h-11 w-full min-w-0 max-w-full items-center rounded-lg border border-gray-300 bg-gray-50 pl-3 pr-10 text-left text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100">
              <span className="min-w-0 flex-1 truncate">{p.value}</span>
              <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                <ArrowsUpDownIcon className={`h-4 w-4 ${open ? "text-blue-500" : "text-gray-400"}`} />
              </span>
            </Listbox.Button>
            <Transition
              show={open}
              enter="transition ease-in-out duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition ease-out duration-75"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Listbox.Options className="absolute left-0 z-40 mt-1 max-h-64 w-full origin-top-left overflow-auto rounded-lg border border-gray-200 bg-neutral-50 py-1 shadow-sm outline-none dark:border-gray-700 dark:bg-neutral-800">
                {p.options.map((option) => (
                  <Listbox.Option key={option} value={option} className="relative">
                    {({ active, selected, disabled }) => (
                      <button
                        type="button"
                        disabled={disabled}
                        aria-disabled={disabled}
                        className={`flex h-9 w-full items-center px-3 text-left text-sm focus:outline-none ${active ? "bg-neutral-100 dark:bg-neutral-700" : ""} ${selected ? "bg-oslyn-100 font-semibold text-oslyn-800 dark:bg-oslyn-600 dark:bg-opacity-15 dark:text-oslyn-100" : "font-normal"}`}
                      >
                        <span className="block min-w-0 flex-1 truncate">{option}</span>
                      </button>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            </Transition>
          </>
        )}
      </Listbox>
      <button type="button" aria-label={p.raiseLabel} disabled={p.raiseDisabled} onClick={() => p.onStep(1)} className={stepButton}>
        +
      </button>
    </div>
  )
}
