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
import Tabs from '../(components)/tabs'

const _tabs = `[Intro]
 
G    G - G2 - G - Gsus4
 
 
[Chorus]
             G
Christ is my firm foundation
    Em              D
The rock on which I stand
                 G
When everything around me is shaken
     Em              D
I’ve never been more glad
              C           G/B
That I put my faith in Jesus
            Em           D
‘Cause He’s never let me down
                      C       G/B
He’s faithful through generations
   Em              D
So why would He fail now
 
 
[Tag]
        G    G  G2  G
He won’t
       Gsus4
He won’t
 
 
[Verse]
               G
I’ve still got joy in chaos
         Em                  D
I’ve got peace that makes no sense
           C G/B Am7  G
I won’t be going un - der
        Em             D
I’m not held by my own strength
                     C/E        G/B
‘Cause I’ve built my life on Jesus
     Em    D/F# G D
He’s never let me down
                 C         G/B
He’s faithful in every season
   Em              D
So why would He fail now
 
 
[Tag 2]
        G         Gsus4
He won’t, He won’t
         Em    D     Cmaj7
He won’t fa    -     il
         Em  D G G/B Cmaj7
He won’t fa    -     il
 
        G         Gsus4
He won’t, He won’t
         Em    D     Cmaj7
He won’t fa    -     il
         Em  D G G/B Cmaj7
He won’t fa    -     il
 
 
[Chorus]
             G
Christ is my firm foundation
    Em              D
The rock on which I stand
                 G
When everything around me is shaken
     Em              D
I’ve never been more glad
              C           G/B
That I put my faith in Jesus
            Em           D
‘Cause He’s never let me down
                      C       G/B
He’s faithful through generations
   Em              D
So why would He fail now
 
 
[Tag 2]
        G         Gsus4
He won’t, He won’t
         Em    D     Cmaj7
He won’t fa    -     il
         Em  D G G/B Cmaj7
He won’t fa    -     il
 
 
[Instrumental]
 
Cmaj7  D  G/B  Em D
Cmaj7  D  G/B  Em D
 
 
[Bridge]
Cmaj7         D
Rain came and wind blew
    G/B                 Em   D
But my house was built on You
Cmaj7    D
I’m safe with You
G/B                 Em      D
I’m going to make it through
 
 
Cmaj7         D
Rain came and wind blew
    G/B                 Em   D/F#
But my house was built on You
Cmaj7    D
I’m safe with You
G/B                 Em      D
I’m going to make it through
 
 
Cmaj7         D
Rain came and wind blew
    G/B                 Em   D
But my house was built on You
Cmaj7    D
I’m safe with You
G/B                 Em      D
I’m going to make it through
 
      Cmaj7                D
Yeah, I’m going to make it through
       G/B                  Em   D/F#
‘Cause I’m standing strong on You
      Cmaj7                D
Yeah, I’m going to make it through
       G/B                 Em
‘Cause my house is built on You
 
 
[Chorus]
D            G              Am7
Christ is my firm foundation
    Em              D
The rock on which I stand
                 C     G/B   Am7   G  Am7
When everything around me is sha - ken
     Em              D
I’ve never been more glad
              C           G/B
That I put my faith in Jesus
            Em    D/F# G D
‘Cause He’s never let me down
                      C       G/B
He’s faithful through generations
   Em              D
So why would He fail now
 
 
[Tag 2]
        G         Gsus4
He won’t, He won’t
         Em    D     Cmaj7
He won’t fa    -     il
         Em  D G G/B Cmaj7
He won’t fa    -     il
 
        G         Gsus4
He won’t, He won’t
         Em    D     Cmaj7
He won’t fa    -     il
         Em  D G G/B Cmaj7
He won’t fa    -     il
       G
No, He won't`

export default function CreateSong() {
  const [ step, setStep ] = useState(0)

  const [ song, setSong ] = useState({
    songId: "", title: "Firm Foundation (He Won't)", chordSheetKey: "G", albumCover: "https://i.scdn.co/image/ab67616d00001e02e38352640d032bb49d7cca48",
    artist: "Maverick City Music", album: "Firm Foundation", chordSheet: _tabs, isApproved: true,
    version: 1, creator: {} as User, recordings: [] as any, 
  } as Song)

  return <div className="text-white w-full h-screen flex flex-col">
    <div className="flex-0">
      <Tabs step={step} setStep={setStep}  />
    </div>
    
    <div className="flex-1 p-4">
      { step === 0 && <PasteTabs tabs={song.chordSheet || ""} setTabs={(t: string) => { setSong({ ...song, chordSheet: t }) }} /> }
      { step === 1 && <SongInfo song={song} setSong={setSong}/>}
      { step === 2 && <Slides song={song} /> }
    </div>
    <Save song={song} type="create" />
  </div>
}