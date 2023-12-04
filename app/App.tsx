// https://docs.expo.dev/guides/monorepos/#modify-the-metro-config
//"node_modules/expo/AppEntry.js",


import { View } from 'react-native'
import { useEffect, useState } from 'react'

import Slides from './app/(player)/slides'
import { Song, User } from '../src/API';
import Calc from './app/(player)/util/calc';
import { OslynSlide } from 'oslyn-core/types';
import { chordSheetToSlides } from "oslyn-core/oslyn"
import { Logs } from 'expo'
import Line from './app/(player)/line';

const localTheme = "light"

export default function App() {
  Logs.enableExpoCliLogging()

  const [ song, _setSong ] = useState<Song>({
    __typename: "Song",
    songId: "af31a3c7-0fac-4fcf-b53e-fe9ec52f19e7",
    title: "Great Things",
    artist: "Phil Wickham",
    album: "Living Hope",
    albumCover: "https://oslynstudio-s3stack-oslynstudiobucket4f3f730f-de5ih4nnn90k.s3.amazonaws.com/song/af31a3c7-0fac-4fcf-b53e-fe9ec52f19e7/cover.jpg",
    isApproved: true,
    version: 1,
    chordSheet: "[Intro]\n \n| G /// | G / Am7 / | Em /// | Em / C / |\n| G /// | G / Am7 / | Em /// | Em / C / |\n \n \n[Verse 1]\n \nG\nCome let us worship our King\nG\nCome let us bow at His feet\n            C\nHe has done great things\nG\nSee what our Savior has done\nG\nSee how His love overcomes\n            C\nHe has done great things\n            Em      D\nHe has done great things\n \n \n[Chorus]\n \n    G\nOh, hero of Heaven, You conquer the grave\n    Em\nYou free every captive and break every chain\n   C\nOh God, You have done great things\n   G\nWe dance in Your freedom, awake and alive\n   Em\nOh Jesus, our Savior, Your name lifted high\n   C\nOh God, You have done great things\n \n \n[Interlude]\n \n| G /// | G / Am7 / | Em /// | Em / C / |\n \n \n[Verse 2]\n \n            G\nYou've been faithful through every storm\n          G\nYou'll be faithful forevermore\n              C\nYou have done great things\n      G\nAnd I know You will do it again\n         G\nFor Your promise is \"Yes and amen\"\n            C\nYou will do great things\n            Em      D\nGod, You do great things\n \n \n[Chorus]\n \n    G\nOh, hero of Heaven, You conquer the grave\n    Em\nYou free every captive and break every chain\n   C\nOh God, You have done great things\n   G\nWe dance in Your freedom, awake and alive\n   Em\nOh Jesus, our Savior, Your name lifted high\n   C                            G\nOh God, You have done great things\n \n \n[Bridge]\n \nC          D\nHallelujah God, above it all\nEm         G/B\nHallelujah God, unshakable\nC           D                     Em   G/B\nHallelujah, You have done great things\nC          D\nHallelujah God, above it all\nEm         G/B\nHallelujah God, unshakable\nC           D                     Em\nHallelujah, You have done great things\n                    D/F#\nYou've done great things\n \n \n[Chorus]\n \n    G\nOh, hero of Heaven, You conquer the grave\n    Em\nYou free every captive and break every chain\n   C\nOh God, You have done great things\n   G\nWe dance in Your freedom, awake and alive\n   Em\nOh Jesus, our Savior, Your name lifted high\n   C\nOh God, You have done great things\n \n \n[Tag]\n \nD               Em\n  You have done great things\nD                C\n  Oh God, You do great things",
    chordSheetKey: "G",
    editors: [],
    viewers: [],
    creator: {} as unknown as User,
    recordings: []
  })

  const [ slides, setSlides ] = useState<OslynSlide>()

  useEffect(() => {
    console.log(song)
    if (song.chordSheet && song.chordSheetKey) {
      console.log(song.chordSheet)
      const oslynSlides = chordSheetToSlides(song.chordSheet, song.chordSheetKey || "C")
      console.log(JSON.stringify(oslynSlides))
      setSlides(oslynSlides)
    }
  }, [song])

  return (
    <View className={`text-black bg-purple-400 w-full h-screen flex flex-col overflow-hidden pt-20 ${localTheme || "light"}`} id='player'>
      <Slides song={song} />
    </View>
  )
}

/*

      <Calc slide={slides} onLayout={function (widths: number[][]): void {
        throw new Error('Function not implemented.');
      } } />

*/

// { slides && <Line phrase={slides.pages[2].lines[0]} skey={song.chordSheetKey || "C"} transpose={0} onMaxWidth={() => {}}/> }
/*<Slides song={song} />*/