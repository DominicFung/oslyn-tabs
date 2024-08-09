import React, { useState } from 'react'

import {Text, View, Image, Pressable, StyleSheet } from 'react-native'

import { Dropdown } from 'react-native-element-dropdown'
import Ionicons from '@expo/vector-icons/Ionicons'

export interface KeyProps {
  skey: string
  setKey:  (capo: string) => void
}

const chords = [
  { label: 'A', value: 'A' },
  { label: 'Bb', value: 'Bb' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'C#', value: 'C#' },
  { label: 'D', value: 'D' },
  { label: 'Eb', value: 'Eb' },
  { label: 'E', value: 'E' },
  { label: 'F', value: 'F' },
  { label: 'F#', value: 'F#' },
  { label: 'G', value: 'G' },
  { label: 'Ab', value: 'Ab' },
]

export default function Key(p: KeyProps) {

  const [isFocus, setIsFocus] = useState(true)

  return <>
    <View className="ml-3 text-sm font-normal max-w-sm">
      <Text className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Key</Text>
      <Text className="pb-3 text-sm font-normal">Set the current song key for the entire team! <Text className="text-xs italic">Note: this affects everyone in the session.</Text></Text>

      <View className=''>
        <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={chords}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? 'Select item' : '...'}
          searchPlaceholder="Search..."
          value={p.skey}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            p.setKey(item.value)
            setIsFocus(false)
          }}
          renderLeftIcon={() => (
            <Ionicons
              style={styles.icon}
              color={isFocus ? 'blue' : 'black'}
              name="musical-note"
              size={20}
            />
          )}
        />
      </View>
    </View>
  </>
}

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: 'white',
    height: 50,
    borderColor: 'gray',
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 999,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
})