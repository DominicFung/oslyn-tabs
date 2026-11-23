import React, { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { parseJamTarget } from '../../src/jamList'
import { useTheme } from '../../src/theme'
import { Body, Btn, Field, Notice, Screen } from '../ui'

export default function JoinScreen(p: { onJoin: (jamSessionId: string, joinToken?: string) => void, onBack: () => void }) {
  const { colors } = useTheme()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [scan, setScan] = useState(false)
  const [permission, requestPermission] = useCameraPermissions()
  const [locked, setLocked] = useState(false)

  const go = (raw: string) => {
    const target = parseJamTarget(raw)
    if (!target) {
      setError('That is not a jam link or room id.')
      return
    }
    p.onJoin(target.jamSessionId, target.joinToken)
  }

  const openCamera = async () => {
    if (!permission?.granted) {
      const next = await requestPermission()
      if (!next.granted) {
        setError('Camera permission is off. Paste the link instead.')
        return
      }
    }
    setLocked(false)
    setScan(true)
  }

  return <Screen title="Join a room" onBack={p.onBack}>
    <Body>
      <Field label="Room link or id" value={value} onChangeText={setValue} autoCapitalize="none" placeholder="https://tabs.oslyn.io/jam/…" />
      <Notice text={error} tone="error" />
      <Btn label="Join" onPress={() => go(value)} />
      <Btn label={scan ? 'Hide camera' : 'Scan QR code'} tone="plain" onPress={() => scan ? setScan(false) : openCamera()} />
      {scan && <View style={styles.camera}>
        <CameraView
          style={StyleSheet.absoluteFill}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={locked ? undefined : ({ data }) => {
            setLocked(true)
            setValue(data)
            go(data)
          }}
        />
      </View>}
      <Text style={{ color: colors.muted }}>A private room also needs you to be signed in, unless the link includes its join token.</Text>
    </Body>
  </Screen>
}

const styles = StyleSheet.create({
  camera: { height: 240, borderRadius: 12, overflow: 'hidden', marginBottom: 12 },
})
