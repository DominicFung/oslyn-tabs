import React, { useEffect, useState } from 'react'
import { Pressable, Share, Text, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { CheckBox } from '@rneui/themed'
import { gql } from '../../../src/graphql/client'
import { ensureJamJoinToken } from '../../../src/graphql/documents'
import { oslynApiUrl } from '../../../src/oslynApi'
import { useTheme } from '../../../src/theme'

function withQuery(path: string, params: URLSearchParams) {
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export default function QrCode(p: { jamSessionId: string, canShare?: boolean, userId?: string }) {
  const { colors, scheme } = useTheme()
  const [addLogin, setAddLogin] = useState(true)
  const [token, setToken] = useState('')

  useEffect(() => {
    if (!p.canShare || !p.userId) return
    let cancelled = false
    gql<{ ensureJamJoinToken: { joinToken: string } | null }>(ensureJamJoinToken, {
      jamSessionId: p.jamSessionId,
      userId: p.userId,
    }).then((res) => {
      const joinToken = res.data?.ensureJamJoinToken?.joinToken
      if (!cancelled && joinToken) setToken(joinToken)
    })
    return () => { cancelled = true }
  }, [p.canShare, p.userId, p.jamSessionId])

  const origin = oslynApiUrl()
  const jamParams = new URLSearchParams()
  if (token) jamParams.set('join', token)
  if (addLogin) jamParams.set('login', 'true')
  const slidesParams = new URLSearchParams()
  if (token) slidesParams.set('join', token)
  const jamUrl = withQuery(`${origin}/jam/${p.jamSessionId}`, jamParams)
  const slidesUrl = withQuery(`${origin}/jam/${p.jamSessionId}/slides`, slidesParams)
  const fg = scheme === 'dark' ? '#FFFFFF' : '#1f2937'
  const bg = scheme === 'dark' ? '#1f2937' : '#FFFFFF'

  return <View>
    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 }}>QR Code</Text>
    <Text style={{ color: colors.text, marginBottom: 12 }}>Quickly share this jam sessions with your friends!</Text>
    <Pressable onPress={() => setAddLogin(!addLogin)} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
      <CheckBox
        checked={addLogin}
        onPress={() => setAddLogin(!addLogin)}
        iconType="material-community"
        checkedIcon="checkbox-outline"
        uncheckedIcon="checkbox-blank-outline"
        containerStyle={{ backgroundColor: 'transparent', margin: 0, padding: 0 }}
      />
      <View style={{ flex: 1, marginLeft: 8 }}>
        <Text style={{ fontWeight: '600', color: colors.text }}>Add Login</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>This will prompt users to login right away, minimizing “guests”. This feature only applies to Jam.</Text>
      </View>
    </Pressable>
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Text style={{ color: colors.text, marginBottom: 8, fontSize: 16 }}>Slides</Text>
      <QRCode value={slidesUrl} backgroundColor={bg} color={fg} size={140} />
    </View>
    <View style={{ height: 1, backgroundColor: colors.line, marginVertical: 16 }} />
    <View style={{ alignItems: 'center', marginVertical: 8 }}>
      <Text style={{ color: colors.text, marginBottom: 8, fontSize: 16 }}>Jam</Text>
      <QRCode value={jamUrl} backgroundColor={bg} color={fg} size={140} />
    </View>
    <Pressable onPress={() => Share.share({ message: jamUrl, url: jamUrl })} style={{ marginTop: 16, backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
      <Text style={{ color: colors.accentText, fontWeight: '700' }}>Share jam link</Text>
    </Pressable>
  </View>
}
