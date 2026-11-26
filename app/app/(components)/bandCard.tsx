import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { Band } from '../../src/API'
import { BAND_THUMB_RESIZE_MODE, bandThumbFrame } from '../../src/phoneLayout'
import { useTheme } from '../../src/theme'

interface BandCardProps {
  band: Band
  onPress?: () => void
}

export default function BandCard(p: BandCardProps) {
  const { colors } = useTheme()
  const frame = bandThumbFrame()
  const uri = p.band.imageUrl?.trim()
  return <Pressable onPress={p.onPress} accessibilityRole="button" style={{ width: frame.width }}>
    {uri
      ? <Image source={{ uri }} resizeMode={BAND_THUMB_RESIZE_MODE} accessibilityLabel={p.band.name} style={[frame, { backgroundColor: colors.card }]} />
      : <View style={[frame, { backgroundColor: colors.chip }]} />}
    <Text numberOfLines={2} style={{ width: frame.width, marginTop: 6, fontSize: 12, lineHeight: 15, fontWeight: '600', color: colors.text, textAlign: 'center' }}>{p.band.name}</Text>
  </Pressable>
}
