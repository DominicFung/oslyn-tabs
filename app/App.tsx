// https://docs.expo.dev/guides/monorepos/#modify-the-metro-config
//"node_modules/expo/AppEntry.js",

import React, { View } from 'react-native'
import { useEffect, useState } from 'react'
import { LinearGradient } from 'expo-linear-gradient'

import { JamSession, User, Band } from './src/API'
import * as q from './src/graphql/queries'

import Player from './app/(player)/player'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'

import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, createTheme } from '@rneui/themed'

import { lockAsync, Orientation, OrientationLock } from 'expo-screen-orientation'

import amplifyconfig from './src/amplifyconfiguration.json'
import Main from './app/main'
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

  // fadaf2f8-182b-4b3c-8331-694b690daf3d
  // const [ jamSessionId, _setJamSessionId ] = useState("")
  
  const [ jam, setJam ] = useState<JamSession>()
  const [ user, setUser ] = useState<User>()

  const [ bands, setBands ] = useState<Band[]>([])
  const [ sessions, setSessions] = useState<JamSession[]>([])
  
  useEffect(() => { 
    getPublicJamSessions()
    getPublicBands()
  }, [])

  useEffect(() => {
    if (jam) { lockAsync(OrientationLock.LANDSCAPE_LEFT) }
    else lockAsync(OrientationLock.DEFAULT)
  }, [ jam ])

  const setJamGivenId = (jamSessionId: string) => {
    getJamSession(jamSessionId)
  }

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

  const getPublicBands = async () => {
    try {
      const { data } = await client.graphql({ 
        query: q.listPublicBands 
      }) as GraphQLResult<{ listPublicBands: Band[] }>

      if (data?.listPublicBands) setBands(data.listPublicBands)
        console.log(data?.listPublicBands)
    } catch (e) {
      console.log(JSON.stringify(e, null, 2))
    }
  }

  const getPublicJamSessions = async () => {
    try {
      const { data } = await client.graphql({ 
        query: q.listPublicJamSessions 
      }) as GraphQLResult<{ listPublicJamSessions: JamSession[] }>

      if (data?.listPublicJamSessions) setSessions(data.listPublicJamSessions)
        console.log(data?.listPublicJamSessions)
    } catch (e) {
      console.log(JSON.stringify(e, null, 2))
    }
  }

  return (<SafeAreaProvider>
    <ThemeProvider theme={theme}>
      <LinearGradient colors={["#e4bcbb", "#bb9bff"]} start={{x: 0, y: 0}} end={{x:0, y:1}} >
        { !jam && bands && sessions && <Main bands={bands} sessions={sessions} setJam={setJamGivenId} /> }
        {  jam && <Player jam={jam} user={null} resetJam={() => { setJam(undefined) }}/> }
      </LinearGradient>
    </ThemeProvider>
  </SafeAreaProvider>)
}