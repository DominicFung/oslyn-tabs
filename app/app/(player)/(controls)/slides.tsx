import React, { useState } from 'react'
import { Text, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { useTheme } from '../../../src/theme'

export interface SlidesProps {
  textSize: string
  setTextSize: (s: string) => void
}

const textSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl', 'text-5xl', 'text-6xl', 'text-7xl']

export default function Slides(p: SlidesProps) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const data = textSizes.map((size) => ({ label: size, value: size }))
  return <View>
    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Slides</Text>
    <Text style={{ color: colors.text, marginBottom: 12 }}>
      Set your text size to make it easier to read!{' '}
      <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted }}>(only affects you)</Text>
    </Text>
    <Dropdown
      style={{ height: 44, borderWidth: 1, borderColor: open ? colors.accent : colors.line, borderRadius: 8, paddingHorizontal: 12, backgroundColor: colors.input }}
      containerStyle={{ backgroundColor: colors.card, borderRadius: 8 }}
      selectedTextStyle={{ color: colors.text }}
      itemTextStyle={{ color: colors.text }}
      activeColor={colors.chip}
      data={data}
      labelField="label"
      valueField="value"
      value={p.textSize}
      maxHeight={240}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onChange={(item: { value: string }) => { p.setTextSize(item.value); setOpen(false) }}
    />
  </View>
}
