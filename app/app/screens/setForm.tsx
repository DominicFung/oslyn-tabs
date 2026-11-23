import React, { useEffect, useRef, useState } from 'react'
import { Alert, PanResponder, Text, View } from 'react-native'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { moveSong, nextSetKey, setSongInputs } from '../../src/setOrder'
import { useTheme } from '../../src/theme'
import { Body, Btn, Card, Field, Notice, Row, Screen } from '../ui'
import { SongRow } from './songs'

type SetSong = { songId: string, title: string, key: string }

export default function SetForm(p: {
  account: Account
  setListId?: string
  onBack: () => void
  onStarted: (jamSessionId: string) => void
  onDeleted: () => void
}) {
  const { colors } = useTheme()
  const [description, setDescription] = useState('')
  const [songs, setSongs] = useState<SetSong[]>([])
  const [library, setLibrary] = useState<SongRow[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([
      gql<{ listSongs: SongRow[] | null }>(d.listSongs, { userId: p.account.userId }),
      gql<{ listSharedSongs: SongRow[] | null }>(d.listSharedSongs, { userId: p.account.userId, optimize: true }),
    ]).then(([own, shared]) => {
      const rows = [...(own.data?.listSongs || []), ...(shared.data?.listSharedSongs || [])].filter(Boolean)
      const seen = new Set<string>()
      setLibrary(rows.filter((song) => seen.has(song.songId) ? false : (seen.add(song.songId), true)))
    })
    if (!p.setListId) return
    gql<{ getSet: { description: string, songs?: Array<{ key?: string | null, song?: { songId: string, title: string } | null } | null> | null } | null }>(
      d.getSet,
      { setListId: p.setListId, userId: p.account.userId }
    ).then((res) => {
      const set = res.data?.getSet
      if (!set) { setError(res.error || 'Could not open that set.'); return }
      setDescription(set.description)
      setSongs((set.songs || []).flatMap((row) => row?.song ? [{ songId: row.song.songId, title: row.song.title, key: row.key || 'C' }] : []))
    })
  }, [p.account.userId, p.setListId])

  const move = (from: number, to: number) => setSongs((current) => moveSong(current, from, to))

  const save = async () => {
    if (!description.trim()) { setError('Give the set a name.'); return }
    setBusy(true)
    const payload = setSongInputs(songs)
    if (p.setListId) {
      const res = await gql<{ updateSet: { setListId: string } | null }>(d.updateSet, {
        setListId: p.setListId, description: description.trim(), songs: payload,
      })
      setBusy(false)
      if (!res.data?.updateSet) { setError(res.error || 'Could not save the set.'); return }
      p.onBack()
      return
    }
    const res = await gql<{ createSet: { setListId: string } | null }>(d.createSet, {
      userId: p.account.userId, description: description.trim(), songs: payload,
    })
    setBusy(false)
    if (!res.data?.createSet) { setError(res.error || 'Could not create the set.'); return }
    p.onBack()
  }

  const startJam = async () => {
    if (!p.setListId) { setError('Save the set before starting a jam.'); return }
    setBusy(true)
    const res = await gql<{ createJamSession: { jamSessionId: string } | null }>(d.createJamSession, {
      setListId: p.setListId, userId: p.account.userId,
    })
    setBusy(false)
    if (!res.data?.createJamSession) { setError(res.error || 'Could not create the jam.'); return }
    p.onStarted(res.data.createJamSession.jamSessionId)
  }

  const remove = async () => {
    if (!p.setListId) return
    const count = await gql<{ countJamsForSet: number }>(d.countJamsForSet, { setListId: p.setListId, userId: p.account.userId })
    const jams = count.data?.countJamsForSet || 0
    Alert.alert('Delete set', `Delete ${description || 'this set'}? ${jams} jam room${jams === 1 ? '' : 's'} will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const res = await gql(d.deleteSet, { setListId: p.setListId, userId: p.account.userId })
        if (!res.data) { setError(res.error || 'Could not delete the set.'); return }
        p.onDeleted()
      } },
    ])
  }

  return <Screen title={p.setListId ? 'Edit set' : 'New set'} onBack={p.onBack}>
    <Body>
      <Field label="Name" value={description} onChangeText={setDescription} placeholder="May 12 2023 Jam" />
      <Text style={{ color: colors.muted, marginBottom: 8 }}>Drag a song, or use the arrows. Save stores the order with updateSet, the same mutation as the website. The name is the set description.</Text>
      {songs.map((song, index) => <SetSongRow
        key={`${song.songId}-${index}`}
        song={song}
        index={index}
        count={songs.length}
        onMove={move}
        onKey={() => setSongs(songs.map((item, songIndex) => songIndex === index ? { ...item, key: nextSetKey(item.key) } : item))}
        onRemove={() => setSongs(songs.filter((_, songIndex) => songIndex !== index))}
      />)}
      <Text style={{ color: colors.muted, fontWeight: '700', marginBottom: 8 }}>ADD A SONG</Text>
      {library.map((song) => <Row key={song.songId} title={song.title} detail={song.artist || ''} onPress={() => setSongs([...songs, { songId: song.songId, title: song.title, key: song.chordSheetKey || 'C' }])} />)}
      <Notice text={error} tone="error" />
      <Btn label="Save" onPress={save} busy={busy} />
      {p.setListId && <Btn label="Create jam" tone="plain" onPress={startJam} />}
      {p.setListId && <Btn label="Delete set" tone="danger" onPress={remove} />}
    </Body>
  </Screen>
}

function SetSongRow(p: {
  song: { title: string, key: string }
  index: number
  count: number
  onMove: (from: number, to: number) => void
  onKey: () => void
  onRemove: () => void
}) {
  const { colors } = useTheme()
  const latest = useRef(p)
  latest.current = p
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 12,
    onPanResponderRelease: (_, gesture) => {
      const current = latest.current
      const rows = Math.round(gesture.dy / 88)
      const next = Math.max(0, Math.min(current.count - 1, current.index + rows))
      if (next !== current.index) current.onMove(current.index, next)
    },
  })).current

  return <Card>
    <View {...pan.panHandlers}>
      <Text style={{ color: colors.text, fontWeight: '700' }}>{p.index + 1}. {p.song.title}</Text>
      <Text style={{ color: colors.muted }}>Drag to reorder</Text>
    </View>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <View style={{ flex: 1 }}><Btn label="Up" tone="plain" onPress={() => p.onMove(p.index, p.index - 1)} /></View>
      <View style={{ flex: 1 }}><Btn label="Down" tone="plain" onPress={() => p.onMove(p.index, p.index + 1)} /></View>
      <View style={{ flex: 1 }}><Btn label={p.song.key} tone="plain" onPress={p.onKey} /></View>
    </View>
    <Btn label="Remove" tone="danger" onPress={p.onRemove} />
  </Card>
}
