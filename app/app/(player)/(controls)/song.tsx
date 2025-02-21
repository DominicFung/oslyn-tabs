import React, { useEffect, useState } from 'react'
import { JamSong } from "../../../src/API"
import {Text, View, Image, Pressable, ScrollView, TextInput } from 'react-native'
import Svg, { Path } from 'react-native-svg'

interface SongProps {
  song: number
  setSong: (n: number) => void
  addToQueue: (songId: string) => void

  songs: JamSong[]
  w: number
  h: number
}

export default function Songs(p: SongProps) {
  const [search, setSearch] = useState("")
  const [ filteredList, setFilteredList] = useState(p.songs)

  useEffect(() => {
    if (search === "") { setFilteredList(p.songs); return } 

    let list = []
    let normalized = search.toLowerCase().trim()
    let words = normalized.split(/[\s,]+/).filter((word: string) => word.length > 0);

    for (let s of p.songs) {
      let title = s.song.title.toLowerCase().trim()
      let artists = s.song.artist?.toLocaleLowerCase().trim()
      
      for (let w of words) {
        if (title.includes(w)) { list.push(s); break; }
        if (artists?.includes(w)) { list.push(s); break; }
      }
    }

    setFilteredList(list)
  }, [search])

  return <View className="ml-3 text-sm font-normal" style={{width: p.w-130, height: filteredList.length>7?p.h-200:undefined}}>
      <Text className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Song</Text>
      <Text className="pb-3 text-sm font-normal">Choose a new Song! <Text className="text-xs italic">Note: this affects everyone in the session.</Text></Text>

      <View className='flex my-2' style={{width: p.w-150}}>
        <TextInput className='bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white'
          placeholder='Search' value={search} onChangeText={setSearch}/>
      </View>

      <ScrollView className="divide-y divide-gray-200 dark:divide-gray-700" style={{width: p.w-140}}>
        { filteredList.map((e, i) => 
          <View className="py-3 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i}>
            <View className="max-w-sm flex flex-row space-x-4" style={{width: p.w-145}}>
              <Pressable className="flex-shrink-0" onPress={() => { p.setSong(i) }}>
                  {e.song.albumCover && <Image className="w-8 h-8 rounded-full" source={{uri: e.song.albumCover}} alt="Neil image" />}
              </Pressable>
              <Pressable className="flex flex-col flex-1 min-w-0" onPress={() => { p.setSong(i) }}>
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
                  onPress={() => { p.addToQueue(e.song.songId) }}>
                <Svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 mt-1 size-6 text-white">
                  <Path fill-rule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd" />
                </Svg>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
}