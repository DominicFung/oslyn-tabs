"use client"
import { useState } from 'react'

import PasteTabs from "../1.pasteTabs"
import SongInfo from '../2.songInfo'
import { SongRequest } from '@/app/api/song/create/route'
import { Song } from '@/src/API'
import { User } from '@/src/API'
import { useRouter } from 'next/navigation'
import Slides from '@/app/(player)/slides'
import Save from '../(components)/save'

const _tabs = `[Intro]
C#m  E  F#m7  G#m7  x2
 
 
[Verse 1]
E
  I see the King of glory
C#m
Coming on the clouds with fire
                 F#m                     B
The whole earth shakes, the whole earth shakes
  C#m
Yeah
E
  I see His love and mercy
C#m
Washing over all our sin
            F#m              B
The people sing, the people sing
 
 
[Chorus]
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
   A           C#m B
Hosanna in the Highest
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
    A          B      C#m
Hosanna in the High - est
 
 
[Verse 2]
E
  I see a generation
C#m
Rising up to take their place
               F#m                  B
With selfless faith, with selfless faith
E
  I see a near revival
C#m
Stirring as we pray and seek
              F#m                 B
We're on our knees, we're on our knees
 
 
[Chorus]
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
   A           C#m B
Hosanna in the Highest
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
    A          B      C#m
Hosanna in the High - est
 
 
[Instrumental]
C#m  E  F#m7  G#m7  x2
 
 
[Bridge]
 A                          B
Heal my heart and make it clean
 E                       C#m
Open up my eyes to the things unseen
 A                        B                C#m
Show me how to love like You have loved me
A                               B
Break my heart for what breaks Yours
 E                        C#m
Everything I am for Your Kingdom's cause
 A                         B          A
As I walk from earth in - to eterni - ty
 
 
[Chorus]
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
   A           C#m B
Hosanna in the Highest
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
    A          B      C#m
Hosanna in the High - est
 
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
   A           C#m B
Hosanna in the Highest
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
    A          B      C#m
Hosanna in the High - est
     E/G# A        B   C#m
Ho - sanna, Ho - san - na
    A          B      E
Hosanna in the High - est`

export const chords = ['A', 'Bb', 'B', 'C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab']

export default function CreateSong() {
  const router = useRouter()
  const [ step, setStep ] = useState(0)

  const [ saveMenu, setSaveMenu ] = useState(false)

  const [ song, setSong ] = useState({
    songId: "", title: "Hosanna", chordSheetKey: chords[7], albumCover: "https://i.scdn.co/image/ab67616d00001e02442a4e58697d1502ed7e613e",
    artist: "Hillsong United", album: "All Of The Above", chordSheet: _tabs, isApproved: true,
    version: 1, creator: {} as User, recordings: [] as any, 
  } as Song)

  const createSong = async () => {
    if (!song.title || !song.chordSheetKey) { console.error("title and key not available"); return }

    const data = await (await fetch(`/api/song/create`, {
      method: "POST",
      body: JSON.stringify({
        title: song.title, chordSheetKey: song.chordSheetKey,
        artist: song.artist, album: song.album, 
        chordSheet: song.chordSheet
      } as SongRequest)
    })).json() as Song
    console.log(data)

    router.push(`/songs`)
  }

  return <div className="text-white w-full h-screen flex flex-col">
    <div className="flex-0">
      <ol className="m-4 flex items-center p-3 space-x-2 text-sm font-medium text-center text-gray-500 bg-white border border-gray-200 rounded-lg shadow-sm dark:text-gray-400 sm:text-base dark:bg-gray-800 dark:border-gray-700 sm:p-4 sm:space-x-4">
        <li className={`flex items-center ${step === 0 && "text-oslyn-600 dark:text-oslyn-400"}`}>
            <button className='flex flex-row' onClick={() => setStep(0)}>
              <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 0 ? "dark:border-oslyn-500": "border-gray-500 dark:border-gray-400"}`}>1</span>
              Paste Text
            </button>
            <svg aria-hidden="true" className="w-4 h-4 ml-2 sm:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </li>
        <li className={`flex items-center ${step === 1 && "text-oslyn-600 dark:text-oslyn-400"}`}>
          <button className='flex flex-row' onClick={() => setStep(1)}>
            <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 1 ? "dark:border-oslyn-500": "border-gray-500 dark:border-gray-400"}`}>2</span>
            Song Info
          </button>
            <svg aria-hidden="true" className="w-4 h-4 ml-2 sm:ml-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
        </li>
        <li className={`flex items-center ${step === 2 && "text-oslyn-600 dark:text-oslyn-400"}`}>
          <button className='flex flex-row' onClick={() => setStep(2)}>
            <span className={`mt-0.5 pt-0.5 items-center justify-center w-5 h-5 mr-2 text-xs border rounded-full shrink-0 ${step === 2 ? "dark:border-oslyn-500": "border-gray-500 dark:border-gray-400"}`}>3</span>
            Review Experience
          </button>
        </li>
      </ol>
    </div>
    
    <div className="flex-1 p-4">
      { step === 0 && <PasteTabs tabs={song.chordSheet || ""} setTabs={(t: string) => { setSong({ ...song, chordSheet: t }) }} /> }
      { step === 1 && <SongInfo song={song} setSong={setSong}/>}
      { step === 2 && <Slides song={song} /> }
    </div>
    <Save song={song} />
  </div>
}