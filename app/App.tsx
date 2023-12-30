// https://docs.expo.dev/guides/monorepos/#modify-the-metro-config
//"node_modules/expo/AppEntry.js",

import React, { View } from 'react-native'
import { useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'

import { JamSession } from './src/API'
import * as q from './src/graphql/queries'

import Player from './app/(player)/player'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'

import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, createTheme } from '@rneui/themed'

import amplifyconfig from './src/amplifyconfiguration.json'
Amplify.configure(amplifyconfig)

// const localTheme = "light"

const theme = createTheme({
  components: {
    'CheckBox' : {
      checkedColor: "#7837ff",
      wrapperStyle: {
        backgroundColor: "white"
      }
    },
  },
})

export default function App() {
  const client = generateClient()

  const [ jamSessionId, _setJamSessionId ] = useState("fadaf2f8-182b-4b3c-8331-694b690daf3d")
  const [ jam, setJam ] = useState<JamSession>()
  
  useEffect(() => { getJamSession(jamSessionId) }, [jamSessionId])

  const getJamSession = async (jamSessionId: string) => {
    try {
      const { data } = await client.graphql({ 
        query: q.getJamSession, variables: { jamSessionId }
      }) as GraphQLResult<{ getJamSession: JamSession }>
      
      if (data?.getJamSession) setJam(data.getJamSession)
      console.log(data?.getJamSession)
    } catch (e) {
      console.log(JSON.stringify(e, null, 2))
    }
  }

  return (<SafeAreaProvider>
    <ThemeProvider theme={theme}>
      <LinearGradient colors={["#e4bcbb", "#bb9bff"]} start={{x: 0, y: 0}} end={{x:0, y:1}} >
        { jam && <Player jam={jam} user={null} /> }
      </LinearGradient>
    </ThemeProvider>
  </SafeAreaProvider>)
  //return <View></View>
}



// const [ song, _setSong ] = useState<Song>({
//   __typename: "Song",
//   songId: "af31a3c7-0fac-4fcf-b53e-fe9ec52f19e7",
//   title: "Great Things",
//   artist: "Phil Wickham",
//   album: "Living Hope",
//   albumCover: "https://oslynstudio-s3stack-oslynstudiobucket4f3f730f-de5ih4nnn90k.s3.amazonaws.com/song/af31a3c7-0fac-4fcf-b53e-fe9ec52f19e7/cover.jpg",
//   isApproved: true,
//   version: 1,
//   chordSheet: "[Intro]\n \n| G /// | G / Am7 / | Em /// | Em / C / |\n| G /// | G / Am7 / | Em /// | Em / C / |\n \n \n[Verse 1]\n \nG\nCome let us worship our King\nG\nCome let us bow at His feet\n            C\nHe has done great things\nG\nSee what our Savior has done\nG\nSee how His love overcomes\n            C\nHe has done great things\n            Em      D\nHe has done great things\n \n \n[Chorus]\n \n    G\nOh, hero of Heaven, You conquer the grave\n    Em\nYou free every captive and break every chain\n   C\nOh God, You have done great things\n   G\nWe dance in Your freedom, awake and alive\n   Em\nOh Jesus, our Savior, Your name lifted high\n   C\nOh God, You have done great things\n \n \n[Interlude]\n \n| G /// | G / Am7 / | Em /// | Em / C / |\n \n \n[Verse 2]\n \n            G\nYou've been faithful through every storm\n          G\nYou'll be faithful forevermore\n              C\nYou have done great things\n      G\nAnd I know You will do it again\n         G\nFor Your promise is \"Yes and amen\"\n            C\nYou will do great things\n            Em      D\nGod, You do great things\n \n \n[Chorus]\n \n    G\nOh, hero of Heaven, You conquer the grave\n    Em\nYou free every captive and break every chain\n   C\nOh God, You have done great things\n   G\nWe dance in Your freedom, awake and alive\n   Em\nOh Jesus, our Savior, Your name lifted high\n   C                            G\nOh God, You have done great things\n \n \n[Bridge]\n \nC          D\nHallelujah God, above it all\nEm         G/B\nHallelujah God, unshakable\nC           D                     Em   G/B\nHallelujah, You have done great things\nC          D\nHallelujah God, above it all\nEm         G/B\nHallelujah God, unshakable\nC           D                     Em\nHallelujah, You have done great things\n                    D/F#\nYou've done great things\n \n \n[Chorus]\n \n    G\nOh, hero of Heaven, You conquer the grave\n    Em\nYou free every captive and break every chain\n   C\nOh God, You have done great things\n   G\nWe dance in Your freedom, awake and alive\n   Em\nOh Jesus, our Savior, Your name lifted high\n   C\nOh God, You have done great things\n \n \n[Tag]\n \nD               Em\n  You have done great things\nD                C\n  Oh God, You do great things",
//   chordSheetKey: "G",
//   editors: [],
//   viewers: [],
//   creator: {} as unknown as User,
//   recordings: []
// })

// const [ slides, setSlides ] = useState<OslynSlide>()

// useEffect(() => {
//   console.log(song)
//   if (song.chordSheet && song.chordSheetKey) {
//     console.log(song.chordSheet)
//     const oslynSlides = chordSheetToSlides(song.chordSheet, song.chordSheetKey || "C")
//     console.log(JSON.stringify(oslynSlides))
//     setSlides(oslynSlides)
//   }
// }, [song])

/*

  <Slides song={song} />

  <Calc slide={slides} onLayout={function (widths: number[][]): void {
    throw new Error('Function not implemented.');
  } } />
*/

// { slides && <Line phrase={slides.pages[2].lines[0]} skey={song.chordSheetKey || "C"} transpose={0} onMaxWidth={() => {}}/> }
/*<Slides song={song} />*/