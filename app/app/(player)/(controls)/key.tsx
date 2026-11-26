import React from 'react'
import { Text, View } from 'react-native'
import Capo from './capo'
import { ChoiceRow } from './choiceRow'
import { SONG_KEYS, stepKey } from '../../../src/sessionSteps'
import { useTheme } from '../../../src/theme'

export interface KeyProps {
  skey?: string
  setKey?: (key: string) => void
  capo?: string
  setCapo?: (capo: string) => void
}

export default function Key(p: KeyProps) {
  const { colors } = useTheme()
  const showKey = !!p.setKey && p.skey != null
  const showCapo = !!p.setCapo && p.capo != null

  return <View>
    {showKey && <>
      <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Key</Text>
      <Text style={{ color: colors.text, marginBottom: 12 }}>
        Set the current song key for the entire team!{' '}
        <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted }}>Note: this affects everyone in the session.</Text>
      </Text>
      <ChoiceRow
        value={p.skey!}
        options={SONG_KEYS}
        onChange={p.setKey!}
        onStep={(direction) => p.setKey!(stepKey(p.skey!, direction))}
        lowerLabel="Lower the key"
        raiseLabel="Raise the key"
      />
    </>}
    {showCapo && <View style={{ marginTop: showKey ? 28 : 0 }}>
      <Capo capo={p.capo!} setCapo={p.setCapo!} />
    </View>}
  </View>
}
