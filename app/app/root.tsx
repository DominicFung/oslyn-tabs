import React, { useState } from 'react'
import { Alert, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { JamSession } from '../src/API'
import { gql } from '../src/graphql/client'
import * as d from '../src/graphql/documents'
import { useSession } from '../src/session'
import { useTheme } from '../src/theme'
import HomeScreen from './screens/home'
import SignInScreen from './screens/signIn'
import JoinScreen from './screens/join'
import SongsScreen from './screens/songs'
import SongDetail from './screens/songDetail'
import SongForm from './screens/songForm'
import ImportSong from './screens/importSong'
import SetsScreen from './screens/sets'
import SetForm from './screens/setForm'
import { SongRow } from './screens/songs'

type Tab = 'jam' | 'songs' | 'sets' | 'you'
type Sheet = SongRow & { chordSheet?: string | null, originLink?: string | null }
type Route =
  | { name: 'tabs' }
  | { name: 'signin' }
  | { name: 'join' }
  | { name: 'song', songId: string, owned: boolean }
  | { name: 'songForm', song?: Sheet }
  | { name: 'import' }
  | { name: 'set', setListId?: string }

export default function Root(p: { nonce: number, onOpenJam: (jam: JamSession) => void }) {
  const { account, signIn } = useSession()
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('jam')
  const [route, setRoute] = useState<Route>({ name: 'tabs' })

  const openJam = async (jamSessionId: string, joinToken?: string) => {
    const res = await gql<{ getJamSession: JamSession | null }>(d.getJamSessionForPlayer, {
      jamSessionId,
      userId: account?.userId,
      joinToken,
    })
    const jam = res.data?.getJamSession
    if (!jam?.jamSessionId || !jam.setList) {
      Alert.alert('Could not open that room', res.error || 'The room is private, missing, or has no set.')
      return
    }
    p.onOpenJam(jam)
  }

  const screen = () => {
    if (route.name === 'signin') return <SignInScreen onDone={async (next) => { await signIn(next); setRoute({ name: 'tabs' }) }} onBack={() => setRoute({ name: 'tabs' })} />
    if (route.name === 'join') return <JoinScreen onBack={() => setRoute({ name: 'tabs' })} onJoin={(id, token) => openJam(id, token)} />
    if (route.name === 'song' && account) return <SongDetail account={account} songId={route.songId} owned={route.owned} onBack={() => setRoute({ name: 'tabs' })} onDeleted={() => setRoute({ name: 'tabs' })} onEdit={(song) => setRoute({ name: 'songForm', song })} />
    if (route.name === 'songForm' && account) return <SongForm account={account} song={route.song} onBack={() => setRoute({ name: 'tabs' })} onSaved={(songId) => setRoute({ name: 'song', songId, owned: true })} />
    if (route.name === 'import' && account) return <ImportSong account={account} onBack={() => setRoute({ name: 'tabs' })} onOpenSong={(songId) => setRoute({ name: 'song', songId, owned: true })} />
    if (route.name === 'set' && account) return <SetForm account={account} setListId={route.setListId} onBack={() => setRoute({ name: 'tabs' })} onDeleted={() => setRoute({ name: 'tabs' })} onStarted={openJam} />
    if (tab === 'songs') return <SongsScreen account={account} onSignIn={() => setRoute({ name: 'signin' })} onOpen={(songId, owned) => setRoute({ name: 'song', songId, owned })} onCreate={() => setRoute({ name: 'songForm' })} onImport={() => setRoute({ name: 'import' })} />
    if (tab === 'sets') return <SetsScreen account={account} onSignIn={() => setRoute({ name: 'signin' })} onOpen={(setListId) => setRoute({ name: 'set', setListId })} onCreate={() => setRoute({ name: 'set' })} />
    if (tab === 'you') return <SignInScreen onDone={async (next) => { await signIn(next); setTab('jam') }} />
    return <HomeScreen
      account={account}
      nonce={p.nonce}
      onJoin={openJam}
      onSignIn={() => setRoute({ name: 'signin' })}
      onJoinByCode={() => setRoute({ name: 'join' })}
      onOpenBand={() => {}}
      onStarted={openJam}
    />
  }

  return <View style={{ flex: 1 }}>
    <View style={{ flex: 1 }}>{screen()}</View>
    {route.name === 'tabs' && <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.card, paddingBottom: insets.bottom }}>
      {([
        ['jam', 'Jam'],
        ['songs', 'Songs'],
        ['sets', 'Sets'],
        ['you', 'You'],
      ] as Array<[Tab, string]>).map(([id, label]) => <Pressable key={id} onPress={() => setTab(id)} style={{ flex: 1, alignItems: 'center', paddingVertical: 12 }}>
        <Text style={{ color: tab === id ? colors.accent : colors.muted, fontWeight: '700' }}>{label}</Text>
      </Pressable>)}
    </View>}
  </View>
}
