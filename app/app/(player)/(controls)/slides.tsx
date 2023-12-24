import React, { useState } from 'react'

import {Text, View, StyleSheet, Pressable, Dimensions } from 'react-native'

import { Dropdown } from 'react-native-element-dropdown'
import { FontAwesome5 } from '@expo/vector-icons'

export interface SlidesProps {
  textSize: string
  setTextSize:  (s: string) => void
}

const textSizes = [
  { label: 'text-xs', value: 'text-xs' },
  { label: 'text-sm', value: 'text-sm' },
  { label: 'text-base', value: 'text-base' },
  { label: 'text-lg', value: 'text-lg' },
  { label: 'text-xl', value: 'text-xl' },
  { label: 'text-2xl', value: 'text-2xl' },
  { label: 'text-3xl', value: 'text-3xl' },
  { label: 'text-4xl', value: 'text-4xl' },
  { label: 'text-5xl', value: 'text-5xl' },
  { label: 'text-6xl', value: 'text-6xl' },
  { label: 'text-7xl', value: 'text-7xl' },
]

export default function Slides(p: SlidesProps) {
  const [isFocus, setIsFocus] = useState(true)
  return <>
    <View className="ml-3 text-sm font-normal max-w-sm">
      <Text className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Slides</Text>
      <Text className="pb-3 text-sm font-normal">Set your text size to make it easier to read! <Text className="text-xs italic">(only affects you)</Text></Text> 

      <View className=''>
        <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={textSizes}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? 'Select item' : '...'}
          searchPlaceholder="Search..."
          value={p.textSize}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            p.setTextSize(item.value);
            setIsFocus(false);
          }}
          renderLeftIcon={() => (
            <FontAwesome5
              style={styles.icon}
              color={isFocus ? 'blue' : 'black'}
              name="text-height"
              size={20}
            />
          )}
        />
      </View>
    </View>
  </>
}

const styles = StyleSheet.create({
  checkBox: {
    
  },
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