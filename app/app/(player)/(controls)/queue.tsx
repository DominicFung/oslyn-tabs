import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { JamSong } from '../../../src/API'
import { useTheme } from '../../../src/theme'

interface QueueProps {
  songs: JamSong[]
  queue: (number | null)[]
  removeFromQueue: (index: number) => void
}

export default function Queue(p: QueueProps) {
  const { colors } = useTheme()
  return <View>
    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Queued Songs</Text>
    <Text style={{ color: colors.text, marginBottom: 12 }}>
      These are the songs currently queued up!{' '}
      <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted }}>Note: this affects everyone in the session.</Text>
    </Text>
    {p.queue.map((index, position) => {
      if (index === null || index === undefined) return null
      const row = p.songs[index]
      if (!row?.song) return null
      return <View key={`${position}-${row.song.songId}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
        {row.song.albumCover ? <Image source={{ uri: row.song.albumCover }} style={{ width: 32, height: 32, borderRadius: 16 }} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.text }}>{row.song.title}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>{row.song.artist} | {row.song.album}</Text>
        </View>
        <Text style={{ color: colors.text }}>{row.key}</Text>
        <Pressable accessibilityLabel="Remove from queue" onPress={() => p.removeFromQueue(position)} style={{ backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
          <Text style={{ color: colors.accentText, fontWeight: '700' }}>−</Text>
        </Pressable>
      </View>
    })}
  </View>
}
