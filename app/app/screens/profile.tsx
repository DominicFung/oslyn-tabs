import React, { useEffect, useState } from 'react'
import { Alert, Linking, Text } from 'react-native'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { ThemeMode, useTheme } from '../../src/theme'
import { Body, Btn, Field, NeedAccount, Notice, Row, Screen } from '../ui'

const IMPORTER_ADMIN = 'mission.possibleforsure@gmail.com'
type Friend = { userId?: string | null, username?: string | null, email?: string | null }

export default function ProfileScreen(p: { account: Account | null, onSignIn: () => void, onSignOut: () => void }) {
  const { colors, mode, setMode } = useTheme()
  const [friends, setFriends] = useState<Friend[]>([])
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = async () => {
    if (!p.account) return
    const res = await gql<{ getUserById: { friends?: Array<Friend | null> | null } | null }>(d.getUserById, { userId: p.account.userId })
    setFriends((res.data?.getUserById?.friends || []).filter((friend): friend is Friend => !!friend?.userId))
  }

  useEffect(() => { load() }, [p.account])

  const account = p.account
  if (!account) return <NeedAccount onSignIn={p.onSignIn} />

  const add = async () => {
    if (!email.trim()) return
    setBusy(true)
    const res = await gql(d.addFriendByEmail, { userId: account.userId, email: email.trim() })
    setBusy(false)
    if (!res.data) { setError(res.error || 'Could not add that friend.'); return }
    setEmail('')
    setError('')
    load()
  }

  const remove = (friendId: string, name: string) => {
    Alert.alert('Remove friend', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        const res = await gql(d.removeFriendById, { userId: account.userId, friendId })
        if (!res.data) { setError(res.error || 'Could not remove that friend.'); return }
        load()
      } },
    ])
  }

  const admin = account.email.trim().toLowerCase() === IMPORTER_ADMIN

  return <Screen title={account.username} subtitle={account.email}>
    <Body>
      <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8 }}>Appearance</Text>
      {(['light', 'dark', 'system'] as ThemeMode[]).map((item) => <Btn key={item} label={item === mode ? `${item} (on)` : item} tone={item === mode ? 'accent' : 'plain'} onPress={() => setMode(item)} />)}
      <Text style={{ color: colors.text, fontWeight: '800', marginVertical: 8 }}>Friends</Text>
      <Field label="Add by email" value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="friend@example.com" />
      <Btn label="Add friend" onPress={add} busy={busy} />
      <Notice text={error} tone="error" />
      {friends.map((friend) => <Row key={friend.userId || ''} title={friend.username || 'Friend'} detail={friend.email || friend.userId || ''} onPress={() => friend.userId && remove(friend.userId, friend.username || 'this friend')} />)}
      {friends.length === 0 ? <Text style={{ color: colors.muted, marginBottom: 12 }}>No friends yet. Tap a friend later to remove them.</Text> : <Text style={{ color: colors.muted, marginBottom: 12 }}>Tap a friend to remove them.</Text>}
      {admin && <>
        <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8 }}>Importer</Text>
        <Text style={{ color: colors.muted, marginBottom: 8 }}>
          Ultimate Guitar imports run as one small task, about $0.01–$0.02 an hour while it is on. The phone cannot sign the request the API requires, so the switch stays on the website.
        </Text>
        <Btn label="Open importer on the website" tone="plain" onPress={() => Linking.openURL('https://tabs.oslyn.io/profile')} />
      </>}
      <Btn label="Send feedback" tone="plain" onPress={() => Linking.openURL('https://github.com/DominicFung/oslyn-tabs/issues/new')} />
      <Btn label="Open tabs.oslyn.io" tone="plain" onPress={() => Linking.openURL('https://tabs.oslyn.io')} />
      <Text style={{ color: colors.muted, marginBottom: 8 }}>User id: {account.userId}</Text>
      <Btn label="Sign out" tone="danger" onPress={p.onSignOut} />
    </Body>
  </Screen>
}
