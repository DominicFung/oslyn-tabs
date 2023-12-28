"use client"

import { useSideBarContext } from "@/app/context"

export interface TabsProps {
  step: number
  setStep: (step: number) => void
}

export default function Tabs({ step, setStep}: TabsProps ) {
  const { openSidebar } = useSideBarContext()
  return <div className={!openSidebar ? "ml-20":"ml-2"}>
    <ol className="m-4 flex items-center p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-lg shadow-sm dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4">
      <li className={`flex items-center ${step === 0 && "text-oslyn-600 dark:text-oslyn-400"}`}>
          <button className='flex flex-row' onClick={() => setStep(0)}>
            <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 0 ? "dark:border-oslyn-500": "border-gray-500 dark:border-gray-400"}`}>1</span>
            Paste Text
          </button>
          <svg aria-hidden="true" className="w-4 h-4 ml-2 md:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
      </li>
      <li className={`flex items-center ${step === 1 && "text-oslyn-600 dark:text-oslyn-400"}`}>
        <button className='flex flex-row' onClick={() => setStep(1)}>
          <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 1 ? "dark:border-oslyn-500": "border-gray-500 dark:border-gray-400"}`}>2</span>
          Song Info
        </button>
          <svg aria-hidden="true" className="w-4 h-4 ml-2 md:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
      </li>
      <li className={`flex items-center ${step === 2 && "text-oslyn-600 dark:text-oslyn-400"}`}>
        <button className='flex flex-row' onClick={() => setStep(2)}>
          <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 2 ? "dark:border-oslyn-500": "border-gray-500 dark:border-gray-400"}`}>3</span>
          Review Experience
        </button>
      </li>
    </ol>
  </div>
}