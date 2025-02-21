import React from 'react'

import { JamSong } from "../../../src/API"
import {Text, View, Image, Pressable, ScrollView, TextInput } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface QueueProps {
  w: number
  songs: JamSong[],
  queue: (number|null)[],
  removeFromQueue: (index: number) => void
}

export default function Users(p: QueueProps) {
  return <View className="ml-3 text-sm font-normal" style={{width: p.w-120}}>
        <Text className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Queued Songs</Text>
        <Text className="pb-3 text-sm font-normal">These are the songs currently queued up! <Text className="text-xs italic">Note: this affects everyone in the session.</Text></Text>
        
  
        <ScrollView className="divide-y divide-gray-200 dark:divide-gray-700" style={{width: p.w-140}}>
          { p.queue.map((a, i) => {
              if (a === null) return <></>
              let e = p.songs[a]
              return <View className="py-3 px-1 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i}>
              <View className="max-w-sm flex flex-row space-x-4" style={{width: p.w-145}}>
                <Pressable className="flex-shrink-0" onPress={() => { p.removeFromQueue(i) }}>
                    {e.song.albumCover && <Image className="w-8 h-8 rounded-full" source={{uri: e.song.albumCover}} alt="Neil image" />}
                </Pressable>
                <Pressable className="flex flex-col flex-1 min-w-0" onPress={() => { p.removeFromQueue(i) }}>
                  <View className='flex-row' style={{justifyContent: "space-between"}}>
                    <Text className="grow-0 flex-1 text-md mt-0.5 font-bold text-gray-900 dark:text-white mr-1" numberOfLines={1} ellipsizeMode='tail'>
                      {e.song.title} 
                    </Text>
                    <Text className="font-medium text-gray-500 dark:text-oslyn-500 mx-2 text-sm">
                      {e.key}
                    </Text>
                  </View>
                  <Text className="text-sm text-gray-500 truncate dark:text-gray-400" numberOfLines={1} ellipsizeMode='tail'>
                    {e.song.artist} | {e.song.album}
                  </Text>
                </Pressable>
                <Pressable className='flex flex-row text-white bg-oslyn-800 font-medium rounded-lg text-sm px-2 py-2.5 text-center mx-1' 
                    onPress={() => { p.removeFromQueue(i) }}>
                  <Svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mt-1 size-6 text-white">
                    <Path fill-rule="evenodd" d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" />
                  </Svg>
                </Pressable>
              </View>
            </View>
            })}
        </ScrollView>
      </View>
}