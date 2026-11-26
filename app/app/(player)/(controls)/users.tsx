import React from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { getUsernameInitials } from '../../../core/utils/frontend'
import { Participant } from '../../../src/API'
import { useTheme } from '../../../src/theme'

export interface UsersProps {
  users: Participant[]
  removeUser: (userId: string) => void
}

export default function Users(p: UsersProps) {
  const { colors } = useTheme()
  return <View>
    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Active Users</Text>
    <Text style={{ color: colors.text, marginBottom: 12 }}>Use this to monitor active users.</Text>
    {p.users.map((person, index) => {
      if (person.participantType === 'GUEST') {
        return <Pressable key={person.userId || index} onPress={() => p.removeUser(person.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: colors.text }}>{getUsernameInitials(person.username || '')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600' }}>{person.username} <Text style={{ fontStyle: 'italic', fontSize: 12 }}>(guest)</Text></Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>{person.userId}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 18 }}>×</Text>
        </Pressable>
      }
      if (!person.user) return null
      return <Pressable key={person.userId || index} onPress={() => p.removeUser(person.userId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
        {person.user.imageUrl ? <Image source={{ uri: person.user.imageUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} /> : <View style={{ width: 32 }} />}
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ color: colors.text, fontWeight: '600' }}>{person.user.username}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 12 }}>{person.user.email}</Text>
        </View>
        <Text style={{ color: colors.muted, fontSize: 18 }}>×</Text>
      </Pressable>
    })}
  </View>
}
