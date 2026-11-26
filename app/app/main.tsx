import React from 'react'
import { Image, Pressable, ScrollView, Text, View } from 'react-native'
import { Band } from '../src/API'
import { JamListRow, jamLabel } from '../src/jamList'
import { getTimeDifferenceFromNowToEpoch } from '../core/utils/frontend'
import BandCard from './(components)/bandCard'
import { Btn, Card, Empty, Notice } from './ui'
import { useTheme } from '../src/theme'

export default function Main(p: {
  bands: Band[]
  sessions: JamListRow[]
  mine: JamListRow[] | null
  error: string
  onJoin: (jamSessionId: string) => void
  onDelete?: (jamSessionId: string) => void
  onStart?: () => void
  starting?: boolean
  onSignIn: () => void
  onJoinByCode: () => void
  onOpenBand: (bandId: string) => void
}) {
  const { colors } = useTheme()
  return <View>
    <Text style={{ fontSize: 40, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 12, marginBottom: 12 }}>Jam Now!</Text>
    <View style={{ paddingHorizontal: 16 }}>
      {p.onStart ? <Btn label={p.starting ? 'Starting…' : 'Start Jam'} onPress={p.onStart} busy={p.starting} /> : <Btn label="Sign in to start a jam" onPress={p.onSignIn} />}
      <Btn label="Join with a code or link" onPress={p.onJoinByCode} tone="plain" />
      <Notice text={p.error} tone="error" />
    </View>

    {p.mine && <Section title="Your jam rooms">
      {p.mine.length === 0
        ? <Empty title="You don't have any jam rooms yet." body="Start one above, or create one from a set." />
        : p.mine.map((room, index) => <RoomRow key={room.jamSessionId} room={room} index={index} onJoin={p.onJoin} onDelete={p.onDelete} />)}
    </Section>}

    <Section title={p.mine ? 'Public rooms' : 'Rooms'}>
      <Header />
      {p.sessions.length === 0
        ? <Empty title="No public rooms right now." body={p.mine ? undefined : 'Your own rooms are private. Sign in to see them.'} />
        : p.sessions.map((room, index) => <RoomRow key={room.jamSessionId} room={room} index={index} onJoin={p.onJoin} />)}
    </Section>

    <Text style={{ paddingHorizontal: 16, paddingTop: 18, fontSize: 18, fontWeight: '800', color: colors.text }}>Artists and Bands:</Text>
    <ScrollView horizontal nestedScrollEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 12 }}>
      {p.bands.map((band) => <BandCard key={band.bandId} band={band} onPress={() => p.onOpenBand(band.bandId)} />)}
    </ScrollView>
  </View>
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  const { colors } = useTheme()
  return <View style={{ marginTop: 8 }}>
    <Text style={{ paddingHorizontal: 16, marginBottom: 8, fontSize: 20, fontWeight: '800', color: colors.text }}>{title}</Text>
    <View style={{ paddingHorizontal: 16 }}>{children}</View>
  </View>
}

function Header() {
  const { colors } = useTheme()
  return <View style={{ flexDirection: 'row', paddingVertical: 8 }}>
    <Text style={{ width: 28, color: colors.muted, fontSize: 12, fontWeight: '700' }}>#</Text>
    <Text style={{ flex: 1, color: colors.muted, fontSize: 12, fontWeight: '700' }}>ROOM ID OR DESCRIPTION</Text>
    <Text style={{ width: 72, color: colors.muted, fontSize: 12, fontWeight: '700', textAlign: 'right' }}>TIME</Text>
  </View>
}

function RoomRow({ room, index, onJoin, onDelete }: {
  room: JamListRow
  index: number
  onJoin: (id: string) => void
  onDelete?: (id: string) => void
}) {
  const { colors } = useTheme()
  const id = room.jamSessionId || ''
  const faces = (room.active || []).filter((person) => person?.user?.imageUrl).slice(0, 4)
  return <Card>
    <Pressable onPress={() => onJoin(id)}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ width: 28, color: colors.muted }}>{index + 1}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>{jamLabel(room)}{room.policy ? `  ${room.policy}` : ''}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>{id}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
        {faces.map((person, faceIndex) => <Image key={person?.user?.userId || faceIndex} source={{ uri: person!.user!.imageUrl! }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 4 }} />)}
        <Text style={{ color: colors.muted, marginLeft: 'auto' }}>{room.startDate ? `${getTimeDifferenceFromNowToEpoch(room.startDate)} ago` : ''}</Text>
      </View>
    </Pressable>
    <View style={{ flexDirection: 'row', marginTop: 8 }}>
      <View style={{ flex: 1, marginRight: 8 }}><Btn label="Join" onPress={() => onJoin(id)} /></View>
      {onDelete ? <View style={{ flex: 1 }}><Btn label="Delete" tone="danger" onPress={() => onDelete(id)} /></View> : null}
    </View>
  </Card>
}
