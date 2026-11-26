import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { JamSession } from './src/API'
import Player from './app/(player)/player'
import Root from './app/root'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ThemeProvider, createTheme } from '@rneui/themed'
import { lockAsync, OrientationLock } from 'expo-screen-orientation'
import { Amplify } from 'aws-amplify'
import amplifyconfig from './src/amplifyconfiguration.json'
import { SessionProvider } from './src/session'
import { AppearanceProvider } from './src/theme'

Amplify.configure(amplifyconfig)

const theme = createTheme({
  components: {
    CheckBox: {
      checkedColor: '#7837ff',
      wrapperStyle: { backgroundColor: 'white' },
    },
  },
})

export default function App() {
  const [jam, setJam] = useState<JamSession>()
  const [openController, setOpenController] = useState(false)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    if (jam && !openController) lockAsync(OrientationLock.LANDSCAPE_LEFT).catch(() => {})
    else lockAsync(OrientationLock.DEFAULT).catch(() => {})
  }, [jam, openController])

  return <SafeAreaProvider>
    <ThemeProvider theme={theme}>
      <SessionProvider>
        <AppearanceProvider>
          <LinearGradient colors={['#e4bcbb', '#bb9bff']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
            {jam
              ? <Player jam={jam} user={null} resetJam={() => { setJam(undefined); setNonce((value) => value + 1) }} openController={openController} setOpenController={setOpenController} />
              : <View style={{ flex: 1 }}><Root nonce={nonce} onOpenJam={setJam} /></View>}
          </LinearGradient>
        </AppearanceProvider>
      </SessionProvider>
    </ThemeProvider>
  </SafeAreaProvider>
}
