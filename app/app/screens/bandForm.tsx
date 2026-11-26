import React, { useEffect, useState } from 'react'
import { Text } from 'react-native'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { useTheme } from '../../src/theme'
import { Body, Btn, Field, Notice, Row, Screen } from '../ui'
import { SongRow } from './songs'

const POLICIES = ['PRIVATE', 'PUBLIC_VIEW', 'PUBLIC_JOIN']

type BandDetail = {
  bandId: string
  name: string
  description?: string | null
  imageUrl?: string | null
  policy?: string | null
  songs?: Array<SongRow | null> | null
}

export default function BandForm(p: {
  account: Account | null
  bandId?: string
  onBack: () => void
  onOpenSong: (songId: string) => void
}) {
  const { colors } = useTheme()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [policy, setPolicy] = useState('PRIVATE')
  const [songs, setSongs] = useState<SongRow[]>([])
  const [library, setLibrary] = useState<SongRow[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const editing = !!p.bandId

  useEffect(() => {
    if (p.account) {
      gql<{ listSongs: SongRow[] | null }>(d.listSongs, { userId: p.account.userId }).then((res) => {
        setLibrary((res.data?.listSongs || []).filter(Boolean))
      })
    }
    if (!p.bandId) return
    gql<{ getBand: BandDetail | null }>(d.getBand, { bandId: p.bandId, userId: p.account?.userId }).then((res) => {
      const band = res.data?.getBand
      if (!band) { setError(res.error || 'Could not open that band.'); return }
      setName(band.name)
      setDescription(band.description || '')
      setImageUrl(band.imageUrl || '')
      setPolicy(band.policy || 'PRIVATE')
      setSongs((band.songs || []).filter((song): song is SongRow => !!song?.songId))
    })
  }, [p.account, p.bandId])

  const save = async () => {
    if (!p.account) { setError('Sign in to save a band.'); return }
    if (!name.trim() || !description.trim()) { setError('Name and description are required.'); return }
    setBusy(true)
    if (!editing) {
      const res = await gql<{ createBand: { bandId: string } | null }>(d.createBand, {
        userId: p.account.userId,
        name: name.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim() || undefined,
        policy,
      })
      setBusy(false)
      if (!res.data?.createBand) { setError(res.error || 'Could not create the band.'); return }
      p.onBack()
      return
    }
    const res = await gql(d.updateBand, { bandId: p.bandId, imageUrl: imageUrl.trim() || undefined, policy })
    setBusy(false)
    setError(res.data ? 'Saved.' : (res.error || 'Could not update the band. Name and description are set when the band is created.'))
  }

  const share = async (songId: string) => {
    if (!p.account || !p.bandId) return
    const res = await gql(d.shareSongWithBand, { bandId: p.bandId, songId, userId: p.account.userId })
    if (!res.data) { setError(res.error || 'Could not add that song.'); return }
    const song = library.find((item) => item.songId === songId)
    if (song) setSongs([...songs, song])
  }

  return <Screen title={editing ? name || 'Band' : 'New band'} onBack={p.onBack}>
    <Body>
      <Field label="Name" value={name} onChangeText={setName} />
      <Field label="Description" value={description} onChangeText={setDescription} />
      <Field label="Image URL" value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />
      <Text style={{ color: colors.muted, marginBottom: 8 }}>Policy: {policy}</Text>
      <Btn label="Change policy" tone="plain" onPress={() => setPolicy(POLICIES[(POLICIES.indexOf(policy) + 1) % POLICIES.length])} />
      <Notice text={error} tone={error === 'Saved.' ? undefined : 'error'} />
      <Btn label={editing ? 'Save policy and image' : 'Create band'} onPress={save} busy={busy} />
      {editing && songs.map((song) => <Row key={song.songId} title={song.title} detail={song.artist || ''} onPress={() => p.onOpenSong(song.songId)} />)}
      {editing && p.account && <>
        <Text style={{ color: colors.muted, fontWeight: '700', marginVertical: 8 }}>ADD ONE OF YOUR SONGS</Text>
        {library.map((song) => <Row key={`lib-${song.songId}`} title={song.title} onPress={() => share(song.songId)} />)}
      </>}
    </Body>
  </Screen>
}
