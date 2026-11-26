import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { CheckBox } from '@rneui/themed'
import { Dropdown } from 'react-native-element-dropdown'
import { capitalizeFirstLetter } from '../../../core/utils/frontend'
import { ThemeMode, useTheme } from '../../../src/theme'

export interface DisplayProps {
  textSize: string
  setTextSize: (s: string) => void
  complex: boolean
  setComplex: (b: boolean) => void
  headsUp: boolean
  setHeadsUp: (b: boolean) => void
}

const textSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl']
const MODE: ThemeMode[] = ['dark', 'light', 'system']

export default function Display(p: DisplayProps) {
  const { colors, mode, setMode } = useTheme()
  const data = textSizes.map((size) => ({ label: size, value: size }))

  return <View>
    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Display</Text>
    <Text style={{ color: colors.text, marginBottom: 12 }}>
      Set your text size to make it easier to read!{' '}
      <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted }}>(only affects you)</Text>
    </Text>
    <Dropdown
      style={{ height: 44, borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingHorizontal: 12, backgroundColor: colors.input }}
      containerStyle={{ backgroundColor: colors.card, borderRadius: 8 }}
      selectedTextStyle={{ color: colors.text }}
      itemTextStyle={{ color: colors.text }}
      activeColor={colors.chip}
      data={data}
      labelField="label"
      valueField="value"
      value={p.textSize}
      maxHeight={240}
      onChange={(item: { value: string }) => p.setTextSize(item.value)}
    />
    <CheckRow checked={p.complex} onPress={() => p.setComplex(!p.complex)} title="Chord Complexity" body="Check this off for chord decorators. Uncheck to simplify." />
    <CheckRow checked={p.headsUp} onPress={() => p.setHeadsUp(!p.headsUp)} title="Heads Up!" body="Have the application show the first line of the next slide." />
    <View style={{ flexDirection: 'row', marginTop: 16, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
      {MODE.map((item) => {
        const selected = item === mode
        const label = item === 'system' ? 'Auto' : `${capitalizeFirstLetter(item)}`
        return <Pressable key={item} onPress={() => setMode(item)} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: selected ? colors.chip : colors.card }}>
          <Text style={{ color: colors.text, fontWeight: selected ? '700' : '500' }}>{label}</Text>
        </Pressable>
      })}
    </View>
  </View>
}

function CheckRow(p: { checked: boolean, onPress: () => void, title: string, body: string }) {
  const { colors } = useTheme()
  return <Pressable onPress={p.onPress} style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 18 }}>
    <CheckBox
      checked={p.checked}
      onPress={p.onPress}
      iconType="material-community"
      checkedIcon="checkbox-outline"
      uncheckedIcon="checkbox-blank-outline"
      containerStyle={{ backgroundColor: 'transparent', margin: 0, padding: 0 }}
    />
    <View style={{ flex: 1, marginLeft: 8 }}>
      <Text style={{ fontWeight: '600', color: colors.text }}>{p.title}</Text>
      <Text style={{ fontSize: 12, color: colors.muted, marginTop: 2 }}>{p.body}</Text>
    </View>
  </Pressable>
}
