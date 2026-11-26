import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { CheckBox } from '@rneui/themed'
import { ChoiceRow } from './choiceRow'
import { CAPO_VALUES, stepCapo } from '../../../src/sessionSteps'
import { useTheme } from '../../../src/theme'

export interface CapoProps {
  capo: string
  setCapo: (capo: string) => void
}

export default function Capo(p: CapoProps) {
  const { colors } = useTheme()
  const [isLead, setIsLead] = useState(false)
  const atMin = stepCapo(p.capo, -1) === p.capo
  const atMax = stepCapo(p.capo, 1) === p.capo

  return <View>
    <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Capo</Text>
    <Text style={{ color: colors.text, marginBottom: 12 }}>
      Set your Capo to make chords easier to play!{' '}
      {!isLead && <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted }}>(only affects you)</Text>}
    </Text>
    <ChoiceRow
      value={p.capo}
      options={CAPO_VALUES}
      onChange={p.setCapo}
      onStep={(direction) => p.setCapo(stepCapo(p.capo, direction))}
      lowerLabel="Lower the capo"
      raiseLabel="Raise the capo"
      lowerDisabled={atMin}
      raiseDisabled={atMax}
    />
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 }}>
      <CheckBox
        checked={isLead}
        onPress={() => setIsLead(!isLead)}
        iconType="material-community"
        checkedIcon="checkbox-outline"
        uncheckedIcon="checkbox-blank-outline"
        containerStyle={{ backgroundColor: 'transparent', margin: 0, padding: 0 }}
      />
      <Pressable style={{ flex: 1, marginLeft: 8 }} onPress={() => setIsLead(!isLead)}>
        <Text style={{ fontWeight: '600', color: colors.text }}>Lead Guarist?</Text>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>
          This will change the key for everyone else when you change the capo! (Because you are the lead and you are all that matters. JK.)
        </Text>
      </Pressable>
    </View>
  </View>
}
