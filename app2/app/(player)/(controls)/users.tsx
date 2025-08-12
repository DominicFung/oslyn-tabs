import React from 'react'

import { getUsernameInitials } from "../../../core/utils/frontend";
import { Participant } from "../../../src/API"
import {Text, View, Image, Pressable, ScrollView } from 'react-native'
import { AntDesign } from '@expo/vector-icons'

export interface UsersProps {
  w: number
  users: (Participant)[]
  removeUser: (userId: string) => void
}

export default function Users(p: UsersProps) {
  return <>
    <ScrollView className="ml-3 text-sm font-normal h-screen" style={{width: p.w-130}}>
      <Text className="pb-2 text-xl font-semibold text-gray-900 dark:text-white">Active Users</Text>
      <Text className="pb-3 text-sm font-normal w-96">Use this to monitor active users.</Text> 

      <View className="divide-y divide-gray-200 dark:divide-gray-700">
        { p.users.map((e, i) => {
          if (e.participantType === "GUEST") {
            return <Pressable className="py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i} onPress={() => { console.log("clicked"); p.removeUser(e.userId) }}>
                  <View className="flex flex-row space-x-4">
                    <View className={`pt-1.5 w-8 h-8 rounded-full bg-${e.colour}-500 text-center`}>
                      <Text className="font-xl text-gray-600 dark:text-gray-300">{getUsernameInitials(e.username || "")}</Text>
                    </View>
                    <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-900 truncate dark:text-white">
                          {e.username} <Text className="italic text-xs">(guest)</Text>
                        </Text>
                        <Text className="text-sm text-gray-500 truncate dark:text-gray-400">
                          {e.userId}
                        </Text>
                    </View>
                    <View className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2">
                      <AntDesign name="close" size={24} color="black" />
                    </View>
                  </View>
                </Pressable>
          }

          console.log(e)
          if (e.user) {
            return <Pressable className="py-3 px-4 my-0.5 sm:pb-4 hover:cursor-pointer hover:bg-oslyn-50 dark:hover:bg-oslyn-800" key={i} onPress={() => { console.log("clicked"); p.removeUser(e.userId) }}>
                    <View className="flex flex-row space-x-4">
                      <View className="flex-shrink-0">
                          {e.user.imageUrl && <Image className="w-8 h-8 rounded-full" source={{uri: e.user.imageUrl}} alt="Neil image" />}
                      </View>
                      <View className="flex-1">
                          <Text className="text-sm font-medium text-gray-900 truncate dark:text-white">
                            {e.user.username}
                          </Text>
                          <Text className="text-sm text-gray-500 truncate dark:text-gray-400">
                            {e.user.email}
                          </Text>
                      </View>
                      <View className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white mr-2">
                        <AntDesign name="close" size={24} color="black" />
                      </View>
                    </View>
                  </Pressable>
          }
        })}
      </View>
    </ScrollView>
  </>
}