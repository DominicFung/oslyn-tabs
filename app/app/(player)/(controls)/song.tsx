import React from 'react'
import { JamSong, Song } from "oslyn-src/API"
import {Text, View, Image, Pressable, Dimensions, ScrollView } from 'react-native'

interface SongProps {
  song: number
  setSong: (n: number) => void

  songs: JamSong[]
}

export default function Songs(p: SongProps) {
  return <ScrollView className="ml-3 text-sm font-normal h-screen">
    <View className='h-full'>
      <Text className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Song</Text>
      <Text className="pb-3 text-sm font-normal">Choose a new Song!<Text className="text-xs italic">Note: this affects everyone in the session.</Text></Text> 

      <View className="max-w-md divide-y divide-gray-200 dark:divide-gray-700">
        { p.songs.map((e, i) => 
          <Pressable className="max-w-xs py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i} onPress={() => { console.log("clicked"); p.setSong(i) }}>
            <View className="flex flex-row space-x-4">
              <View className="flex-shrink-0">
                  {e.song.albumCover && <Image className="w-8 h-8 rounded-full" source={{uri: e.song.albumCover}} alt="Neil image" />}
              </View>
              <View className="flex-1 min-w-0">
                  <Text className="text-sm font-medium text-gray-900 truncate dark:text-white">
                    {e.song.title}
                  </Text>
                  <Text className="text-sm text-gray-500 truncate dark:text-gray-400">
                    {e.song.artist} | {e.song.album}
                  </Text>
              </View>
              <Text className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2">
                {e.key}
              </Text>
            </View>
          </Pressable>
        )}
    </View>

    </View>
    
  </ScrollView>
}