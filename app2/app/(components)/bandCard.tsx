import React from 'react'
import {Text, View, Image, Pressable } from 'react-native'

import { Band } from "../../src/API"

interface BandCardProps {
  band: Band
}

export default function BandCard(p: BandCardProps) {
  return <View className="bg-white border w-full border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
    <Pressable onPress={() => {  }}>
        <Image className="p-4 rounded-t-lg w-full" source={{ uri: p.band.imageUrl||"" }} width={500} height={500} alt="product image" />
    </Pressable>
    <View className="px-4 pb-4 w-full">
      <Text className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white truncate">{p.band.name}</Text>
      <Text className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap truncate">{p.band.description}</Text>
    </View>
  </View>
}