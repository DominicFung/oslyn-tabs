import React, { useEffect, useState } from 'react'

// import { Cog6ToothIcon } from "@heroicons/react/24/solid"
import { JamSong, Participant } from "../../src/API"

import Songs from "./(controls)/song"
import Key from "./(controls)/key"
import Capo from "./(controls)/capo"
import Display from "./(controls)/display"
import QrCode from "./(controls)/qrcode"
import Slides from "./(controls)/slides"
import Users from "./(controls)/users"

import {Text, View, ScrollView, Pressable } from 'react-native'
import Modal from 'react-native-modal'
import Svg, { Path } from 'react-native-svg'

export interface ControlsProp {
  jamSessionId: string,
  capo?: {
    capo: string
    setCapo: (capo: string) => void
  }
  song?: {
    song: number
    setSong: (n: number) => void
    songs: JamSong[]
  }
  sKey?: {
    skey: string
    setKey: (s: string) => void
  }
  display?: {
    textSize: string
    setTextSize:  (s: string) => void
    auto: boolean
    setAuto: (b: boolean) => void
    complex: boolean
    setComplex: (b: boolean) => void
    headsUp: boolean
    setHeadsUp: (b: boolean) => void
  }
  slides?: {
    textSize: string
    setTextSize:  (s: string) => void
  }

  users?: {
    active: Participant[]
    removeActive: (s: string) => void
  }
  
  pt?: boolean | undefined
}

export default function Controls(p: ControlsProp) {
  const [ open, setOpen ] = useState(false)

  const [ options, setOptions ] = useState([
    { name: "Song", disabled: false },
    { name: "Key", disabled: false },
    { name: "Capo", disabled: false },
    { name: "Display", disabled: false },
    { name: "QR", disabled: false },
    { name: "Slides", disabled: false },
    { name: "Users", disabled: false }
  ])

  useEffect(() => {
    setOptions([
      { name: "Song", disabled: !p.song || !p.song.songs || !p.song.setSong },
      { name: "Key", disabled: !p.sKey || !p.sKey.skey || !p.sKey.setKey },
      { name:"Capo", disabled: !p.capo || !p.capo.capo || !p.capo.setCapo },
      { name: "Display", disabled: !p.display || !p.display.textSize || !p.display.setTextSize || !p.display.setAuto || !p.display.setComplex },
      { name: "QR", disabled: false },
      { name: "Slides", disabled: p.users ? false : true },
      { name: "Users", disabled: false }
    ])
  }, [p])

  const [ option, setOption ] = useState(0)

  return <>
      <Pressable id="authentication-modal" aria-hidden={true} className={`${open?"":"hidden"} absolute top-0 left-0 right-0 z-40 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-full max-h-full bg-gray-900/75`} 
        onPress={() => { setOpen(false) }} />

      <Modal isVisible={open} onBackdropPress={() => {setOpen(false)}} className='absolute sm:max-w-lg w-full max-h-80 flex items-center w-50 p-4 space-x-4 text-gray-500 bg-white divide-x divide-gray-200 rounded-lg shadow right-0 sm:right-10 ${p.pt?"top-32":"top-4"} dark:text-gray-400 dark:divide-gray-700 space-x dark:bg-gray-800'>
        <View className="text-sm font-normal bg-white">
          <View className="flex flex-row">
            <View className='flex max-h-80'>
              <ScrollView className="py-4 text-sm font-medium text-center text-gray-500">
                <View className='mx-w-xs divide-y divide-gray-200 dark:divide-gray-700 pb-5'>
                  {options.map((o, i) => 
                      <Pressable disabled={o.disabled} onPress={() => setOption(i)} key={i}
                        className={`mr-2 inline-block p-4 border-b-2 ${option === i ? "text-oslyn-600 border-b-2 border-oslyn-600":"border-transparent"} rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300`}>
                          <View><Text>{o.name}</Text></View>
                      </Pressable>
                  )}
                </View>
              </ScrollView>
            </View>

            <View className='max-h-80 py-4'>
              { option === 0 && <Songs song={p.song!.song} setSong={(n) => {p.song!.setSong(n); setOpen(false)}} songs={p.song!.songs}  /> }
              { option === 1 && <Key skey={p.sKey!.skey} setKey={p.sKey!.setKey} /> }
              { option === 2 && <Capo capo={p.capo!.capo} setCapo={p.capo!.setCapo} /> }
              { option === 3 && <Display textSize={p.display!.textSize} setTextSize={p.display!.setTextSize} 
                                    auto={p.display!.auto} setAuto={p.display!.setAuto} 
                                    complex={p.display!.complex} setComplex={p.display!.setComplex}
                                    headsUp={p.display!.headsUp} setHeadsUp={p.display!.setHeadsUp}
                                /> }
              { option === 4 && <QrCode jamSessionId={p.jamSessionId} /> }
              { option === 5 && <Slides textSize={p.slides!.textSize} setTextSize={p.slides!.setTextSize}  /> }
              { option === 6 && <Users users={p.users!.active} removeUser={p.users!.removeActive} /> }
            </View>
            <Pressable className="hidden sm:inline-flex ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-0 sm:p-1.5 hover:bg-gray-100 h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-interactive" aria-label="Close"
              onPress={() => setOpen(false)}
            >
              <Text className="sr-only">Close</Text>
              <Svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <Path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></Path></Svg>
            </Pressable>
          </View>
        </View>
      </Modal>
      
        
    { !open && <Pressable onPress={() => setOpen(true)}
      className={`absolute z-90 right-2 sm:right-10 ${p.pt ?"top-32":"top-4"} bg-coral-400 w-12 h-12 rounded-lg p-2 drop-shadow-lg flex justify-center items-center text-4xl hover:bg-coral-300 hover:drop-shadow-2xl`}
    >
      <Svg fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" className="w-8 h-8 text-oslyn-800">
        <Path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <Path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </Svg>
    </Pressable>}
  </>
}
