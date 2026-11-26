import React, { useCallback, useEffect, useState } from 'react'
import { Alert, RefreshControl, ScrollView } from 'react-native'
import { Band } from '../../src/API'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { JamListRow, jamLabel, jamRows } from '../../src/jamList'
import { jamTitle } from '../../src/jamTitle'
import { Account } from '../../src/session'
import Main from '../main'

export default function HomeScreen(p: {
  account: Account | null
  nonce: number
  onJoin: (jamSessionId: string) => void
  onSignIn: () => void
  onJoinByCode: () => void
  onOpenBand: (bandId: string) => void
  onStarted: (jamSessionId: string) => void
}) {
  const [bands, setBands] = useState<Band[]>([])
  const [sessions, setSessions] = useState<JamListRow[]>([])
  const [mine, setMine] = useState<JamListRow[] | null>(null)
  const [error, setError] = useState('')
  const [starting, setStarting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async () => {
    const notes: string[] = []
    const pub = await gql<{ listPublicJamSessions: JamListRow[] | null }>(d.listPublicJamSessions)
    if (!pub.data) notes.push(pub.error || 'Could not load public rooms.')
    setSessions(jamRows(pub.data?.listPublicJamSessions))

    if (p.account) {
      const own = await gql<{ listUserJamSessions: JamListRow[] | null }>(d.listUserJamSessions, { userId: p.account.userId })
      if (!own.data) notes.push(own.error || 'Could not load your rooms.')
      setMine(jamRows(own.data?.listUserJamSessions))
    } else {
      setMine(null)
    }

    const bandRes = await gql<{ listPublicBands: Band[] | null }>(d.listPublicBands)
    if (bandRes.data?.listPublicBands) setBands(bandRes.data.listPublicBands.filter(Boolean) as Band[])
    setError(notes.join(' '))
  }, [p.account])

  useEffect(() => { load() }, [load, p.nonce])

  const start = async () => {
    if (!p.account || starting) return
    setStarting(true)
    setError('')
    const description = jamTitle(Intl.DateTimeFormat().resolvedOptions().timeZone)
    const created = await gql<{ createSet: { setListId: string } | null }>(d.createSet, {
      userId: p.account.userId,
      description,
      songs: [],
    })
    const setListId = created.data?.createSet?.setListId
    if (!setListId) {
      setError(created.error || 'Could not create the set')
      setStarting(false)
      return
    }
    const jam = await gql<{ createJamSession: { jamSessionId: string } | null }>(d.createJamSession, {
      setListId,
      userId: p.account.userId,
      policy: 'PRIVATE',
      description,
    })
    const jamSessionId = jam.data?.createJamSession?.jamSessionId
    setStarting(false)
    if (!jamSessionId) {
      setError(jam.error || 'Could not start the jam')
      return
    }
    p.onStarted(jamSessionId)
  }

  const remove = (jamSessionId: string) => {
    if (!p.account) return
    const room = (mine || []).find((item) => item.jamSessionId === jamSessionId)
    Alert.alert('Delete jam room', `Delete ${jamLabel(room || {})}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const res = await gql<{ deleteJamSession: { jamSessionId: string } | null }>(d.deleteJamSession, {
          jamSessionId,
          userId: p.account!.userId,
        })
        if (!res.data?.deleteJamSession) {
          setError(res.error || 'Could not delete this jam')
          return
        }
        load()
      } },
    ])
  }

  return <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}>
    <Main
      bands={bands}
      sessions={sessions}
      mine={mine}
      error={error}
      onJoin={p.onJoin}
      onDelete={p.account ? remove : undefined}
      onStart={p.account ? start : undefined}
      starting={starting}
      onSignIn={p.onSignIn}
      onJoinByCode={p.onJoinByCode}
      onOpenBand={p.onOpenBand}
    />
  </ScrollView>
}
