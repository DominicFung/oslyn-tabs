import React, { useEffect } from "react"
import {Text, View, Image, Pressable, ScrollView } from 'react-native'
import { Band, JamSession } from "../src/API"

import ClickableCell from "./(components)/clickableCell"
import BandCard from "./(components)/bandCard"

import Svg, { Path } from 'react-native-svg'
import { getTimeDifferenceFromNowToEpoch } from '../core/utils/frontend'

interface MainProps {
  bands: Band[]
  sessions: JamSession[]

  setJam: (jamId: string) => void
}

export default function Main(p: MainProps) {
  return <ScrollView>
    <View className="bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern.svg')] dark:bg-[url('https://flowbite.s3.amazonaws.com/docs/jumbotron/hero-pattern-dark.svg')]">
      <Text className="mx-auto mt-20 mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">Jam Now!</Text>
      <View className="pt-2 px-4 pb-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:pb-4 z-10 relative">
        

        <View className="relative overflow-x-auto shadow-md rounded-md sm:rounded-lg mx-5">
          <View className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <View className="flex flex-row text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <Text className="px-6 py-3 w-6">
                  #
              </Text>
              <Text className="px-6 py-3">
                  Room ID or Description
              </Text>
              <Text className="px-6 py-3 w-20">
                  Time
              </Text>
            </View>
            <View>
              { p.sessions.map((a, i) => <View key={i} className="flex flex-row bg-white border-b dark:bg-gray-900 dark:border-gray-700">
                      <ClickableCell onClick={() => p.setJam(a.jamSessionId)} className="font-medium text-gray-900 whitespace-nowrap dark:text-white hidden sm:table-cell">
                        <Text className="px-6 py-3 w-6">{i+1}</Text>
                      </ClickableCell>
                    
                      <ClickableCell onClick={() => p.setJam(a.jamSessionId)} className="px-6 py-4 text-ellipsis">
                        <View className="flex-0 m-2 w-36 lg:w-full">
                          <Text className="text-base dark:text-white text-gray-800 bold truncate">{a.description || a.setList.description }</Text>
                          <Text className="text-xs text-ellipsis truncate">{a.jamSessionId}</Text>
                        </View>
                      </ClickableCell>
                      <ClickableCell onClick={() => p.setJam(a.jamSessionId)} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                        <View className="flex flex-row">
                          { a.active.map((a, i) => {
                            if (i < 5) 
                              return  <View className="m-auto w-16">
                                        { a && a?.user && a?.user?.imageUrl &&  <Image source={{uri: a!.user!.imageUrl}} alt={""} width={40} height={40} className="w-10 m-2" /> }
                                      </View>
                            else return <></>
                          })}
                        </View>
                      </ClickableCell>
                      <ClickableCell onClick={() => p.setJam(a.jamSessionId)} className="px-6 py-4 hidden sm:table-cell text-ellipsis">
                        <View className="flex flex-row bg-gray-500 border-gray-300 text-sm px-2 py-1 border text-center rounded-md">
                          <Svg fill="currentColor" className="w-4 h-4 m-1 mt-1 text-gray-300" viewBox="0 0 20 20">
                            <Path fillRule="evenodd" clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"></Path>
                          </Svg>
                          <Text className="flex-1 text-center pt-0.5 text-white">{getTimeDifferenceFromNowToEpoch(a.startDate!)} ago</Text>
                        </View>
                      </ClickableCell>
                    
                    <View className="px-6 py-4 hidden sm:table-cell">
                      <View className="flex flex-row">
                        <Pressable onPress={() => { p.setJam(a.jamSessionId) }}
                            className="flex flex-row text-white bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center mr-2 mb-2">
                          <Text className='text-md pt-0.5'>Join</Text>
                          <Svg fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" className="ml-2 w-4 h-4 mt-1">
                            <Path stroke-linecap="round" stroke-linejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15M12 9l3 3m0 0-3 3m3-3H2.25" />
                          </Svg>
                        </Pressable>
                      </View>
                    </View>
                </View>)}
            </View>
          </View>
        </View>
      </View>
    </View>
    
    <View className="relative z-20">
      <Text className="pt-8 px-6 text-lg font-bold dark:text-white text-gray-700">Artists and Bands:</Text>
      <View className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 m-5 gap-2">
        { p.bands.map((b, i) => <View key={i}>
              <BandCard band={b} />
            </View>
        )}
      </View>
    </View>
  </ScrollView>
}