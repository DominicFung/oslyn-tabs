import React, { useState } from 'react'

import {Text, View, Pressable, StyleSheet } from 'react-native'

import { Dropdown } from 'react-native-element-dropdown'
import Ionicons from '@expo/vector-icons/Ionicons'

import { CheckBox } from '@rneui/themed'

export interface CapoProps {
  capo: string
  setCapo:  (capo: string) => void
}

//const capos = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]

const capos = [
  { label: '0', value: '0' },
  { label: '1', value: '1' },
  { label: '2', value: '2' },
  { label: '3', value: '3' },
  { label: '4', value: '4' },
  { label: '5', value: '5' },
  { label: '6', value: '6' },
  { label: '7', value: '7' },
  { label: '8', value: '8' },
  { label: '9', value: '9' },
  { label: '10', value: '10' },
  { label: '11', value: '11' },
]

export default function Capo(p: CapoProps) {

  const [ isLead, setIsLead ] = useState(true)

  const [value, setValue] = useState("0")
  const [isFocus, setIsFocus] = useState(true)

  return <>
    <View className="ml-3 text-sm font-normal max-w-sm">
      <Text className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Capo</Text>
      <Text className="pb-3 text-sm font-normal">Set your Capo to make chords easier to play! 
        { !isLead && <Text className="text-xs italic">(only affects you)</Text> }
      </Text> 

      <View className=''>
        <Dropdown
          style={[styles.dropdown, isFocus && { borderColor: 'blue' }]}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          inputSearchStyle={styles.inputSearchStyle}
          iconStyle={styles.iconStyle}
          data={capos}
          search
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder={!isFocus ? 'Select item' : '...'}
          searchPlaceholder="Search..."
          value={value}
          onFocus={() => setIsFocus(true)}
          onBlur={() => setIsFocus(false)}
          onChange={item => {
            setValue(item.value);
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
      
      <View className="flex flex-row mt-10 mb-5">
        <View className="h-24">
          {/* <input id="helper-checkbox" aria-describedby="helper-checkbox-text" type="checkbox" value="" checked={isLead} onChange={() => setIsLead(!isLead)}
              className="w-4 h-4 text-oslyn-600 bg-gray-100 border-gray-300 rounded focus:ring-oslyn-500 dark:focus:ring-oslyn-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" /> */}
            <CheckBox
              checked={isLead}
              onPress={() => { setIsLead(!isLead) }}
              iconType="material-community"
              checkedIcon="checkbox-outline"
              uncheckedIcon={'checkbox-blank-outline'}
            />          
        </View>
        <Pressable className="ml-2 text-sm" onPress={() => { setIsLead(!isLead) }}>
          <Text className="font-medium text-gray-900 dark:text-gray-300">Lead Guarist?</Text>
          <Text className="text-xs font-normal text-gray-500 dark:text-gray-300 w-80 pr-2">This will change the key for everyone else when you change the capo! <Text className="text-xs italic">(Because you are the lead and you are all that matters. JK.)</Text></Text>
        </Pressable>
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