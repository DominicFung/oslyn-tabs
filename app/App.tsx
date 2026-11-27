import React, { useEffect, useMemo, useState } from 'react'
import { StatusBar, View } from 'react-native'
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
import { AppearanceProvider, useTheme } from './src/theme'
import { screenGradient } from './src/themeColors'

Amplify.configure(amplifyconfig)

export default function App() {
  const [jam, setJam] = useState<JamSession>()
  const [openController, setOpenController] = useState(false)
  const [nonce, setNonce] = useState(0)

  return <SafeAreaProvider>
    <SessionProvider>
      <AppearanceProvider>
        <Shell
          jam={jam}
          nonce={nonce}
          openController={openController}
          setJam={setJam}
          setNonce={setNonce}
          setOpenController={setOpenController}
        />
      </AppearanceProvider>
    </SessionProvider>
  </SafeAreaProvider>
}

function Shell(p: {
  jam?: JamSession
  nonce: number
  openController: boolean
  setJam: (jam: JamSession | undefined) => void
  setNonce: (update: (value: number) => number) => void
  setOpenController: (open: boolean) => void
}) {
  const { scheme, colors } = useTheme()
  const theme = useMemo(() => createTheme({
    components: {
      CheckBox: {
        checkedColor: '#7837ff',
        wrapperStyle: { backgroundColor: scheme === 'dark' ? colors.card : 'white' },
      },
    },
  }), [scheme, colors.card])

  useEffect(() => {
    // The jam screen locks landscape itself. Everywhere else stays portrait.
    if (!p.jam) lockAsync(OrientationLock.PORTRAIT_UP).catch(() => {})
  }, [p.jam])

  const wash = screenGradient(scheme)
  return <ThemeProvider theme={theme}>
    <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} />
    <LinearGradient colors={wash} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      {p.jam
        ? <Player jam={p.jam} user={null} resetJam={() => { p.setJam(undefined); p.setNonce((value) => value + 1) }} openController={p.openController} setOpenController={p.setOpenController} />
        : <View style={{ flex: 1 }}><Root nonce={p.nonce} onOpenJam={p.setJam} /></View>}
    </LinearGradient>
  </ThemeProvider>
}
