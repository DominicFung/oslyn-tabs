import React from 'react'

import { useState, useEffect } from "react"
import { capitalizeFirstLetter } from "../../../core/utils/frontend"

import {Text, View, Pressable, StyleSheet, ScrollView } from 'react-native'

import { Dropdown } from 'react-native-element-dropdown'
import Ionicons from '@expo/vector-icons/Ionicons'
import { CheckBox } from '@rneui/themed'

export interface DisplayProps {
  textSize: string
  setTextSize:  (s: string) => void
  
  auto: boolean
  setAuto: (b: boolean) => void

  complex: boolean
  setComplex: (b: boolean) => void

  headsUp: boolean
  setHeadsUp: (b: boolean) => void
}

//const textSizes = ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl']
const textSizes = [
  { label: 'text-xs', value: 'text-xs' },
  { label: 'text-sm', value: 'text-sm' },
  { label: 'text-base', value: 'text-base' },
  { label: 'text-lg', value: 'text-lg' },
  { label: 'text-xl', value: 'text-xl' },
  { label: 'text-2xl', value: 'text-2xl' },
  { label: 'text-3xl', value: 'text-3xl' },
]

const MODE = ["dark", "light", "system"]

export default function Display(p: DisplayProps) {
  const [isFocus, setIsFocus] = useState(true)

  //const [mounted, setMounted] = useState(false)
  const theme = "light"; const setTheme = (m: string) => {  }
  const [ mode, setMode ] = useState(theme || "dark")

  //useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setTheme(mode) }, [mode])
  useEffect(() => { if (theme && theme != mode) { setMode(theme) }}, [theme])

  return <>
    <View className="ml-3 text-sm font-normal max-w-sm h-full">
      <Text className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Display</Text>
      <Text className="pb-3 text-sm font-normal">Set your text size to make it easier to read! 
        <Text className="text-xs italic">(only affects you)</Text>
      </Text> 

      <ScrollView className="max-h-[calc(100vh-10rem)]">
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
              <Ionicons
                style={styles.icon}
                color={isFocus ? 'blue' : 'black'}
                name="musical-note"
                size={20}
              />
            )}
          />
        </View>

        <View className="flex flex-row mt-6 mb-5">
          <View className="h-16">
            <CheckBox
              checked={p.complex}
              onPress={() => { p.setComplex(!p.complex) }}
              iconType="material-community"
              checkedIcon="checkbox-outline"
              uncheckedIcon={'checkbox-blank-outline'}
            /> 
          </View>
          <Pressable className="ml-2 mt-4 text-sm" onPress={() => { p.setComplex(!p.complex) }}>
            <Text className="font-medium text-gray-900 dark:text-gray-300">Chord Complexity</Text>
            <Text className="text-xs font-normal text-gray-500 dark:text-gray-300">Check this off for chord decorators. Uncheck to simplify.</Text>
          </Pressable>
        </View>

        <View className={`flex flex-row mb-5`}>
          <View className="h-16">
            <CheckBox
              checked={p.headsUp}
              onPress={() => p.setHeadsUp(!p.headsUp) }
              iconType="material-community"
              checkedIcon="checkbox-outline"
              uncheckedIcon={'checkbox-blank-outline'}
            />
          </View>
          <Pressable className="ml-2 mt-4 text-sm" onPress={() => { p.setHeadsUp(!p.headsUp) }}>
            <Text className="font-medium text-gray-900 dark:text-gray-300">Heads Up!</Text>
            <Text className="text-xs font-normal text-gray-500 dark:text-gray-300">Have the application show the first line of the next slide.</Text>
          </Pressable>
        </View>

        <View className="mt-6 w-full mx-2 max-w-sm relative z-10">
          <View className="flex w-full flex-row text-sm font-medium text-center text-gray-500 divide-x-3 divide-gray-200 rounded-lg shadow sm:flex dark:divide-gray-700 dark:text-gray-400">
            { MODE.map((m,i) => {
              let selected = m === mode
              let first = i === 0
              let last = i === MODE.length - 1

              return <View className="" key={i}>
                <Pressable onPress={() => setMode(m)} disabled={theme === undefined}
                  className={`p-4 ${
                    selected ? "text-gray-900 bg-gray-100 dark:bg-gray-700 dark:text-white active": "bg-white hover:text-gray-700 hover:bg-gray-50 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"} ${
                      first && "rounded-l-lg" } ${ last && "rounded-r-lg" } focus:ring-4 focus:ring-oslyn-300 focus:outline-none focus:z-10 relative`} aria-current="page">
                  <Text>{m !== "system" && capitalizeFirstLetter(m)} {m === "system"?"Auto":"Mode"}</Text>
                </Pressable>
              </View>
            }) }
          </View>
        </View>

      </ScrollView>
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