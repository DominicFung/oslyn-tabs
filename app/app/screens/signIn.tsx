import React, { useEffect, useState } from 'react'
import { Platform, Text } from 'react-native'
import { exchangeIdentity } from '../../src/oslynApi'
import { Account } from '../../src/session'
import { useTheme } from '../../src/theme'
import { Body, Btn, Notice, Screen } from '../ui'

const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || ''
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || ''
const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || ''
const googleConfigured = !!(googleIosClientId || googleAndroidClientId || googleWebClientId)

export default function SignInScreen(p: { onDone: (account: Account) => void, onBack?: () => void }) {
  const { colors } = useTheme()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const finish = async (provider: 'google' | 'apple', idToken: string, name?: string) => {
    setBusy(true)
    setError('')
    try {
      const account = await exchangeIdentity({ provider, idToken, name })
      await p.onDone(account)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  const apple = async () => {
    if (Platform.OS !== 'ios') {
      setError('Sign in with Apple is available on iPhone and iPad.')
      return
    }
    let Apple: typeof import('expo-apple-authentication')
    try {
      Apple = require('expo-apple-authentication')
    } catch {
      setError('Rebuild the iOS app after turning on Sign in with Apple.')
      return
    }
    try {
      const available = await Apple.isAvailableAsync()
      if (!available) {
        setError('Sign in with Apple is not available on this device.')
        return
      }
      const credential = await Apple.signInAsync({
        requestedScopes: [
          Apple.AppleAuthenticationScope.FULL_NAME,
          Apple.AppleAuthenticationScope.EMAIL,
        ],
      })
      if (!credential.identityToken) {
        setError('Apple did not return an identity token.')
        return
      }
      const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ')
      await finish('apple', credential.identityToken, name)
    } catch (err) {
      const code = (err as { code?: string })?.code
      if (code === 'ERR_REQUEST_CANCELED') return
      setError('Apple sign-in failed.')
    }
  }

  return <Screen title="Sign in" subtitle="The same Oslyn account as the website" onBack={p.onBack}>
    <Body>
      <Text style={{ color: colors.muted, marginBottom: 16 }}>
        Google and Apple are checked on the server. The app does not accept an email or user id typed by hand.
      </Text>
      {googleConfigured
        ? <GoogleGate onToken={(idToken) => finish('google', idToken)} onError={setError} busy={busy} />
        : <Notice text="Set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID before building, then rebuild." tone="error" />}
      {Platform.OS === 'ios' && <Btn label="Continue with Apple" tone="plain" onPress={apple} busy={busy} />}
      <Notice text={error} tone="error" />
    </Body>
  </Screen>
}

function GoogleGate(p: { onToken: (idToken: string) => void, onError: (message: string) => void, busy: boolean }) {
  const [mods, setMods] = useState<{ Google: typeof import('expo-auth-session/providers/google'), WebBrowser: typeof import('expo-web-browser') } | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    try {
      setMods({
        Google: require('expo-auth-session/providers/google'),
        WebBrowser: require('expo-web-browser'),
      })
    } catch {
      setFailed(true)
    }
  }, [])

  if (failed) return <Notice text="Rebuild the iOS app to enable Google sign-in." tone="error" />
  if (!mods) return null
  return <GoogleButton mods={mods} {...p} />
}

function GoogleButton(p: {
  mods: { Google: typeof import('expo-auth-session/providers/google'), WebBrowser: typeof import('expo-web-browser') }
  onToken: (idToken: string) => void
  onError: (message: string) => void
  busy: boolean
}) {
  p.mods.WebBrowser.maybeCompleteAuthSession()
  const [request, response, promptAsync] = p.mods.Google.useIdTokenAuthRequest({
    iosClientId: googleIosClientId || undefined,
    androidClientId: googleAndroidClientId || undefined,
    webClientId: googleWebClientId || undefined,
  })

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken = response.params?.id_token || response.authentication?.idToken
      if (idToken) p.onToken(idToken)
      else p.onError('Google did not return an ID token.')
    } else if (response?.type === 'error') {
      p.onError('Google sign-in failed.')
    }
  }, [response])

  return <Btn label="Continue with Google" onPress={() => promptAsync()} disabled={!request} busy={p.busy} />
}
