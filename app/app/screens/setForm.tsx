import React, { useEffect, useState } from 'react'
import { Alert, Text } from 'react-native'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
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
    gql<{ listSongs: SongRow[] | null }>(d.listSongs, { userId: p.account.userId }).then((res) => {
      setLibrary((res.data?.listSongs || []).filter(Boolean))
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

  const move = (index: number, dir: -1 | 1) => {
    const next = index + dir
    if (next < 0 || next >= songs.length) return
    const copy = songs.slice()
    const [item] = copy.splice(index, 1)
    copy.splice(next, 0, item)
    setSongs(copy)
  }

  const save = async () => {
    if (!description.trim()) { setError('Give the set a name.'); return }
    setBusy(true)
    const payload = songs.map((song, order) => ({ songId: song.songId, key: song.key, order }))
    if (p.setListId) {
      const res = await gql<{ updateSet: { setListId: string } | null }>(d.updateSet, {
        setListId: p.setListId, userId: p.account.userId, description: description.trim(), songs: payload,
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
      <Field label="Description" value={description} onChangeText={setDescription} />
      {songs.map((song, index) => <Card key={`${song.songId}-${index}`}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{index + 1}. {song.title}</Text>
        <Text style={{ color: colors.muted }}>Key {song.key}</Text>
        <Btn label="Up" tone="plain" onPress={() => move(index, -1)} />
        <Btn label="Down" tone="plain" onPress={() => move(index, 1)} />
        <Btn label="Remove" tone="danger" onPress={() => setSongs(songs.filter((_, songIndex) => songIndex !== index))} />
      </Card>)}
      <Text style={{ color: colors.muted, fontWeight: '700', marginBottom: 8 }}>ADD A SONG</Text>
      {library.map((song) => <Row key={song.songId} title={song.title} detail={song.artist || ''} onPress={() => setSongs([...songs, { songId: song.songId, title: song.title, key: song.chordSheetKey || 'C' }])} />)}
      <Notice text={error} tone="error" />
      <Btn label="Save" onPress={save} busy={busy} />
      {p.setListId && <Btn label="Create jam" tone="plain" onPress={startJam} />}
      {p.setListId && <Btn label="Delete set" tone="danger" onPress={remove} />}
    </Body>
  </Screen>
}
