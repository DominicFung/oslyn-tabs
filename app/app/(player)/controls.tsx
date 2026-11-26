import React, { useEffect, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import Svg, { Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useWindowDimensions } from 'react-native'
import { JamSong, Participant } from '../../src/API'
import { gearModalFrame } from '../../src/jamLayout'
import { JamSongChange, PlaylistUpdate } from '../../src/jamPlaylist'
import { useTheme } from '../../src/theme'

import Songs from './(controls)/song'
import Key from './(controls)/key'
import Display from './(controls)/display'
import QrCode from './(controls)/qrcode'
import Slides from './(controls)/slides'
import Users from './(controls)/users'
import Queue from './(controls)/queue'

export interface ControlsProp {
  jamSessionId: string
  open: boolean
  setOpen: (b: boolean) => void
  capo?: {
    capo: string
    setCapo: (capo: string) => void
  }
  song?: {
    song: number
    addToQueue: (songId: string) => void
    setSong: (n: number) => void
    songs: JamSong[]
    canAddSongs?: boolean
    userId?: string
    onSongAdded?: (change: JamSongChange) => void
    onSongRemoved?: (update: PlaylistUpdate) => void
    queueAt?: (index: number) => void
  }
  sKey?: {
    skey: string
    setKey: (s: string) => void
  }
  display?: {
    textSize: string
    setTextSize: (s: string) => void
    auto: boolean
    setAuto: (b: boolean) => void
    complex: boolean
    setComplex: (b: boolean) => void
    headsUp: boolean
    setHeadsUp: (b: boolean) => void
  }
  slides?: {
    textSize: string
    setTextSize: (s: string) => void
  }
  users?: {
    active: Participant[]
    removeActive: (s: string) => void
  }
  queue?: {
    songs: JamSong[]
    queueOrder: (number | null)[]
    removeFromQueue: (index: number) => void
  }
  qrCode?: boolean
  canShareJam?: boolean
  userId?: string
}

const RAIL = 104

export default function Controls(p: ControlsProp) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const frame = gearModalFrame({ width, height }, insets)
  const [option, setOption] = useState(0)
  const [options, setOptions] = useState([
    { name: 'Song', disabled: false },
    { name: 'Key', disabled: false },
    { name: 'Display', disabled: false },
    { name: 'QR', disabled: false },
    { name: 'Slides', disabled: false },
    { name: 'Users', disabled: false },
    { name: 'Queue', disabled: false },
  ])

  useEffect(() => {
    const ops = [
      { name: 'Song', disabled: !p.song || !p.song.songs || !p.song.setSong },
      { name: 'Key', disabled: (!p.sKey || !p.sKey.skey || !p.sKey.setKey) && (!p.capo || !p.capo.capo || !p.capo.setCapo) },
      { name: 'Display', disabled: !p.display || !p.display.textSize || !p.display.setTextSize || !p.display.setComplex },
      { name: 'QR', disabled: p.qrCode === false },
      { name: 'Slides', disabled: !p.slides },
      { name: 'Users', disabled: !p.users },
      { name: 'Queue', disabled: !p.queue || !p.queue.songs || !p.queue.removeFromQueue },
    ]
    setOptions(ops)
    if (ops[option]?.disabled) {
      const next = ops.findIndex((item) => !item.disabled)
      if (next >= 0) setOption(next)
    }
  }, [p, option])

  return <>
    <Modal
      isVisible={p.open}
      onBackdropPress={() => p.setOpen(false)}
      onBackButtonPress={() => p.setOpen(false)}
      coverScreen
      statusBarTranslucent
      avoidKeyboard
      useNativeDriverForBackdrop
      deviceWidth={width}
      deviceHeight={height}
      style={{ margin: 0 }}
    >
      <View style={{ width, height }} pointerEvents="box-none">
      <View style={{
        position: 'absolute',
        top: frame.top,
        left: frame.left,
        width: frame.width,
        height: frame.height,
        backgroundColor: colors.card,
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
      }}>
        <ScrollView
          style={{ width: RAIL, height: frame.height, backgroundColor: colors.input }}
          contentContainerStyle={{ paddingVertical: 8 }}
          keyboardShouldPersistTaps="handled"
        >
          {options.map((item, index) => item.disabled ? null : (
            <Pressable
              key={item.name}
              onPress={() => setOption(index)}
              style={{
                marginHorizontal: 8,
                marginVertical: 4,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 8,
                backgroundColor: option === index ? colors.accent : 'transparent',
              }}
            >
              <Text numberOfLines={1} style={{ textAlign: 'center', fontWeight: '700', color: option === index ? colors.accentText : colors.text }}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView
          style={{ height: frame.height, width: Math.max(0, frame.width - RAIL) }}
          contentContainerStyle={{ padding: 16, paddingTop: 40, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {option === 0 && p.song && <Songs
            jamSessionId={p.jamSessionId}
            song={p.song.song}
            setSong={(n) => { p.song!.setSong(n); p.setOpen(false) }}
            addToQueue={p.song.addToQueue}
            songs={p.song.songs}
            canAddSongs={p.song.canAddSongs}
            userId={p.song.userId}
            onSongAdded={p.song.onSongAdded}
            onSongRemoved={p.song.onSongRemoved}
            queueAt={p.song.queueAt}
          />}
          {option === 1 && <Key skey={p.sKey?.skey} setKey={p.sKey?.setKey} capo={p.capo?.capo} setCapo={p.capo?.setCapo} />}
          {option === 2 && p.display && <Display
            textSize={p.display.textSize}
            setTextSize={p.display.setTextSize}
            complex={p.display.complex}
            setComplex={p.display.setComplex}
            headsUp={p.display.headsUp}
            setHeadsUp={p.display.setHeadsUp}
          />}
          {option === 3 && <QrCode jamSessionId={p.jamSessionId} canShare={p.canShareJam} userId={p.userId} />}
          {option === 4 && p.slides && <Slides textSize={p.slides.textSize} setTextSize={p.slides.setTextSize} />}
          {option === 5 && p.users && <Users users={p.users.active} removeUser={p.users.removeActive} />}
          {option === 6 && p.queue && <Queue songs={p.queue.songs} queue={p.queue.queueOrder} removeFromQueue={p.queue.removeFromQueue} />}
        </ScrollView>
        <Pressable
          accessibilityLabel="Close"
          onPress={() => p.setOpen(false)}
          style={{ position: 'absolute', right: 8, top: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={20} height={20} viewBox="0 0 20 20">
            <Path fill={colors.text} fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </Svg>
        </Pressable>
      </View>
      </View>
    </Modal>

    {!p.open && <Pressable
      accessibilityLabel="Open jam settings"
      onPress={() => p.setOpen(true)}
      style={{
        position: 'absolute',
        zIndex: 20,
        right: insets.right + 12,
        top: insets.top + 12,
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f0a8a4',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={28} height={28} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="#4c1d95">
        <Path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
        <Path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </Svg>
    </Pressable>}
  </>
}
