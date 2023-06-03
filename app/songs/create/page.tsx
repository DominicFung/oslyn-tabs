"use client"
import { useState } from 'react'

import PasteTabs from "./1.PasteTabs"
import SongInfo from './2.SongInfo'
import { SongRequest } from '@/app/api/song/create/route'
import { Song } from '@/src/API'

const _tabs = `[Intro]
C
 
[Verse 1]
          C        Am
I found a love for me
              F                            G
Darling, just dive right in, and follow my lead
                C          Am
Well, I found a girl beautiful and sweet
        F                                     G
I never knew you were the someone waiting for me
 
[Pre-Chorus]
                                C
Cause we were just kids when we fell in love
            Am                      F                C  G
Not knowing what it was, I will not give you up this ti-ime
             C                           Am
Darling just kiss me slow, your heart is all I own
            F                     G
And in your eyes you're holding mine
 
[Chorus]
      Am   F             C          G              Am
Baby, I'm dancing in the dark, with you between my arms
F                C     G                Am
Barefoot on the grass, listening to our favourite song
          F                C                 G              Am
When you said you looked a mess, I whispered underneath my breath
         F                C        G          C
But you heard it, darling you look perfect tonight
 
|(C) G/B Am G | F  G  |
 
[Verse 2]
                C                    Am
Well, I found a woman, stronger than anyone I know
              F                                          G
She shares my dreams, I hope that someday I'll share her home
           C             Am
I found a love, to carry more than just my secrets
         F                              G
To carry love, to carry children of our own
 
[Pre-Chorus]
                             C                     Am
We are still kids, but we're so in love, fighting against all odds
             F               C  G
I know we'll be alright this ti-ime
             C                              Am
Darling just hold my hand, be my girl, I'll be your man
         F               G
I see my future in your eyes
 
[Chorus]
      Am   F              C         G              Am
Baby, I'm dancing in the dark, with you between my arms
F                C     G                Am
Barefoot on the grass, listening to our favourite song
        F                C                G
When I saw you in that dress, looking so beautiful
  Am       F                  C        G          C
I don't deserve this, darling you look perfect tonight
 
[Interlude]
|(C) | C | Am | % |
| F  | % | G  | % |
 
[Chorus]
      Am   F              C         G              Am
Baby, I'm dancing in the dark, with you between my arms
F                C     G                Am
Barefoot on the grass, listening to our favourite song
        F              C               G             Am
I have faith in what I see, now I know I have met an angel
    F          C         G
In person, and she looks perfect
 
[Outro]
  C/E     F           Gsus4    G          C
I don't deserve this, you look perfect tonight
 
|(C) G/B Am G | F  G  | C`

export const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']

export default function CreateSong() {
  const [ step, setStep ] = useState(0)

  const [ songInfo, setSongInfo ] = useState({
    title: "Perfect", key: chords[10], artist: "Ed Sheeran", album: "", rawTabs: _tabs
  } as SongRequest)

  const createSong = async () => {
    if (!songInfo.title || !songInfo.key) { console.error("title and key not available"); return }

    const data = await (await fetch(`/api/song/create`, {
      method: "POST",
      body: JSON.stringify({ ...songInfo } as SongRequest)
    })).json() as Song
    console.log(data)
  }

  return <div className="text-white w-full">
    <ol className="m-4 flex items-center p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-lg shadow-sm dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4">
        <li className={`flex items-center ${step === 0 && "text-blue-600 dark:text-blue-500"}`}>
            <button className='flex flex-row' onClick={() => setStep(0)}>
              <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 0 ? "dark:border-blue-500": "border-gray-500 dark:border-gray-400"}`}>1</span>
              Paste Text
            </button>
            <svg aria-hidden="true" className="w-4 h-4 ml-2 sm:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </li>
        <li className={`flex items-center ${step === 1 && "text-blue-600 dark:text-blue-500"}`}>
          <button className='flex flex-row' onClick={() => setStep(1)}>
            <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 1 ? "dark:border-blue-500": "border-gray-500 dark:border-gray-400"}`}>2</span>
            Song Info
          </button>
            <svg aria-hidden="true" className="w-4 h-4 ml-2 sm:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </li>
        <li className={`flex items-center ${step === 2 && "text-blue-600 dark:text-blue-500"}`}>
          <button className='flex flex-row' onClick={() => setStep(2)}>
            <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 2 ? "dark:border-blue-500": "border-gray-500 dark:border-gray-400"}`}>3</span>
            Review Experience
          </button>
        </li>
    </ol>
    <div className="p-4">
      { step === 0 && <PasteTabs tabs={songInfo.rawTabs} setTabs={(t: string) => { setSongInfo({ ...songInfo, rawTabs: t }) }} /> }
      { step === 1 && <SongInfo songInfo={songInfo} setSongInfo={setSongInfo}/>}
    </div>
    <div id="toast-bottom-right" className="fixed flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-5 bottom-5 dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800" role="alert">
        <div className="text-sm font-normal">
          <div className="flex">
            <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-blue-500 bg-blue-100 rounded-lg dark:text-blue-300 dark:bg-blue-900">
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"></path></svg>
              <span className="sr-only">Refresh icon</span>
            </div>
            <div className="ml-3 text-sm font-normal">
              <span className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">All Done?</span>
              <div className="mb-2 text-sm font-normal">Review the experience now!</div> 
              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <button disabled={songInfo.rawTabs === "" || songInfo.title === "" || songInfo.key === "" } onClick={createSong}
                        className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-800 disabled:bg-gray-600">
                          Submit
                      </button>
                  </div>
                  <div>
                      <button className="inline-flex justify-center w-full px-2 py-1.5 text-xs font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-600 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700">Not now</button> 
                  </div>
              </div>    
            </div>
            <button type="button" className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close">
              <span className="sr-only">Close</span>
              <svg aria-hidden="true" className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
            </button>
          </div>
        </div>
    </div>
  </div>
}