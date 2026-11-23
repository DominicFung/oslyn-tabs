import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Text } from 'react-native'
import { useTheme } from '../../src/theme'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { Body, Btn, Empty, Field, NeedAccount, Notice, Row, Screen } from '../ui'

export type SongRow = {
  songId: string
  title: string
  artist?: string | null
  album?: string | null
  albumCover?: string | null
  chordSheetKey?: string | null
}

export default function SongsScreen(p: {
  account: Account | null
  onSignIn: () => void
  onOpen: (songId: string, owned: boolean) => void
  onCreate: () => void
  onImport: () => void
}) {
  const { colors } = useTheme()
  const [own, setOwn] = useState<SongRow[]>([])
  const [shared, setShared] = useState<SongRow[]>([])
  const [found, setFound] = useState<SongRow[] | null>(null)
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!p.account) return
    const userId = p.account.userId
    const mine = await gql<{ listSongs: SongRow[] | null }>(d.listSongs, { userId })
    const others = await gql<{ listSharedSongs: SongRow[] | null }>(d.listSharedSongs, { userId, optimize: true })
    if (!mine.data && !others.data) setError(mine.error || others.error || 'Could not load songs.')
    setOwn((mine.data?.listSongs || []).filter(Boolean))
    setShared((others.data?.listSharedSongs || []).filter(Boolean))
  }, [p.account])

  useEffect(() => { load() }, [load])

  const needle = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (!needle) return own
    return own.filter((song) => `${song.title} ${song.artist || ''}`.toLowerCase().includes(needle))
  }, [own, needle])

  const searchLibrary = async () => {
    if (!p.account || !needle) { setFound(null); return }
    setBusy(true)
    const res = await gql<{ searchSongs: SongRow[] | null }>(d.searchSongs, { userId: p.account.userId, query: query.trim() })
    setBusy(false)
    if (!res.data) { setError(res.error || 'Search failed.'); return }
    setFound((res.data.searchSongs || []).filter(Boolean))
  }

  if (!p.account) return <NeedAccount onSignIn={p.onSignIn} />

  return <Screen title="Songs" subtitle={`${p.account.username}'s songs`}>
    <Body>
      <Btn label="Add song" onPress={p.onCreate} />
      <Btn label="Import from Spotify / Ultimate Guitar" tone="plain" onPress={p.onImport} />
      <Field label="Search your songs" value={query} onChangeText={setQuery} autoCapitalize="none" placeholder="Title or artist" />
      <Btn label="Search library" tone="plain" onPress={searchLibrary} busy={busy} />
      <Notice text={error} tone="error" />
      {needle && filtered.length === 0 ? <Empty title={`No songs match “${query.trim()}”.`} /> : null}
      {filtered.map((song) => <Row key={song.songId} title={song.title} detail={song.artist || song.chordSheetKey || ''} meta={song.chordSheetKey || ''} onPress={() => p.onOpen(song.songId, true)} />)}
      {filtered.length === 0 && !needle ? <Empty title="You don't have any songs yet." body="Add a chord sheet or import one." /> : null}
      <Text style={{ color: colors.muted, fontWeight: '700', marginTop: 8, marginBottom: 8 }}>SHARED WITH ME</Text>
      {shared.length === 0 ? <Empty title="Nothing shared yet." /> : shared.map((song) => <Row key={song.songId} title={song.title} detail={song.artist || ''} onPress={() => p.onOpen(song.songId, false)} />)}
      {found && <>
        <Text style={{ color: colors.muted, fontWeight: '700', marginTop: 8, marginBottom: 8 }}>LIBRARY SEARCH</Text>
        {found.length === 0 ? <Empty title="No library matches." /> : found.map((song) => <Row key={`s-${song.songId}`} title={song.title} detail={song.artist || ''} onPress={() => p.onOpen(song.songId, true)} />)}
      </>}
    </Body>
  </Screen>
}
