import React, { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { useTheme } from '../../../src/theme'

export function ChoiceRow(p: {
  value: string
  options: readonly string[]
  onChange: (value: string) => void
  onStep: (direction: -1 | 1) => void
  lowerLabel: string
  raiseLabel: string
  lowerDisabled?: boolean
  raiseDisabled?: boolean
}) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const data = p.options.map((option) => ({ label: option, value: option }))

  return <View style={styles.row}>
    <Pressable
      accessibilityLabel={p.lowerLabel}
      disabled={p.lowerDisabled}
      onPress={() => p.onStep(-1)}
      style={[styles.step, { borderColor: colors.line, backgroundColor: colors.input, opacity: p.lowerDisabled ? 0.4 : 1 }]}
    >
      <Text style={[styles.stepText, { color: colors.text }]}>−</Text>
    </Pressable>
    <Dropdown
      style={[styles.dropdown, { borderColor: open ? colors.accent : colors.line, backgroundColor: colors.input }]}
      containerStyle={{ backgroundColor: colors.card, borderRadius: 8 }}
      selectedTextStyle={{ color: colors.text, fontSize: 16 }}
      itemTextStyle={{ color: colors.text }}
      activeColor={colors.chip}
      data={data}
      labelField="label"
      valueField="value"
      value={p.value}
      maxHeight={240}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onChange={(item: { value: string }) => {
        p.onChange(item.value)
        setOpen(false)
      }}
    />
    <Pressable
      accessibilityLabel={p.raiseLabel}
      disabled={p.raiseDisabled}
      onPress={() => p.onStep(1)}
      style={[styles.step, { borderColor: colors.line, backgroundColor: colors.input, opacity: p.raiseDisabled ? 0.4 : 1 }]}
    >
      <Text style={[styles.stepText, { color: colors.text }]}>+</Text>
    </Pressable>
  </View>
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  step: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 22, lineHeight: 26 },
  dropdown: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
})
