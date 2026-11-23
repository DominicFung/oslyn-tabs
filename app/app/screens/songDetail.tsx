import React, { useEffect, useState } from 'react'
import { Alert, Text } from 'react-native'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { useTheme } from '../../src/theme'
import { Body, Btn, Card, Field, Keys, Notice, Screen } from '../ui'
import { SongRow } from './songs'

type Sheet = SongRow & { chordSheet?: string | null, originLink?: string | null }

export default function SongDetail(p: {
  account: Account
  songId: string
  owned: boolean
  onBack: () => void
  onEdit: (song: Sheet) => void
  onDeleted: () => void
}) {
  const { colors } = useTheme()
  const [song, setSong] = useState<Sheet | null>(null)
  const [error, setError] = useState('')
  const [email, setEmail] = useState('')
  const [access, setAccess] = useState<'view' | 'edit' | 'admin'>('view')
  const [bandId, setBandId] = useState('')
  const [keyName, setKeyName] = useState('C')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    gql<{ getSong: Sheet | null }>(d.getSongForSheet, { songId: p.songId, userId: p.account.userId }).then((res) => {
      if (!res.data?.getSong) { setError(res.error || 'Could not open that song.'); return }
      setSong(res.data.getSong)
      setKeyName(res.data.getSong.chordSheetKey || 'C')
    })
  }, [p.account.userId, p.songId])

  const share = async () => {
    if (!email.trim()) return
    setBusy(true)
    const res = await gql(d.shareSong, { songId: p.songId, userId: p.account.userId, shareWithEmail: email.trim(), access })
    setBusy(false)
    setError(res.data ? `Shared with ${email.trim()}.` : (res.error || 'Could not share that song.'))
    if (res.data) setEmail('')
  }

  const shareBand = async () => {
    if (!bandId.trim()) return
    setBusy(true)
    const res = await gql(d.shareSongWithBand, { bandId: bandId.trim(), songId: p.songId, userId: p.account.userId })
    setBusy(false)
    setError(res.data ? 'Added to the band.' : (res.error || 'Could not add this song to the band.'))
  }

  const remove = async () => {
    const usage = await gql<{ getSongUsage: { setCount: number, jamCount: number } | null }>(d.getSongUsage, { songId: p.songId, userId: p.account.userId })
    const sets = usage.data?.getSongUsage?.setCount || 0
    const jams = usage.data?.getSongUsage?.jamCount || 0
    Alert.alert('Delete song', `${song?.title || 'This song'} is in ${sets} set${sets === 1 ? '' : 's'} and ${jams} jam${jams === 1 ? '' : 's'}.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        const res = await gql(d.deleteSong, { songId: p.songId, userId: p.account.userId })
        if (!res.data) { setError(res.error || 'Could not delete that song.'); return }
        p.onDeleted()
      } },
    ])
  }

  return <Screen title={song?.title || 'Song'} subtitle={song?.artist || ''} onBack={p.onBack}>
    <Body>
      <Notice text={error} tone={error.startsWith('Shared') || error.startsWith('Added') ? undefined : 'error'} />
      <Keys value={keyName} onChange={setKeyName} />
      <Card>
        <Text style={{ color: colors.text, fontFamily: 'Courier', fontSize: 15 }}>{song?.chordSheet || 'No chord sheet yet.'}</Text>
      </Card>
      {p.owned && song && <Btn label="Edit" onPress={() => p.onEdit(song)} />}
      {p.owned && <>
        <Field label="Share with email" value={email} onChangeText={setEmail} autoCapitalize="none" placeholder="friend@example.com" />
        <ViewAccess access={access} setAccess={setAccess} />
        <Btn label="Share" onPress={share} busy={busy} />
        <Field label="Add to a band" value={bandId} onChangeText={setBandId} autoCapitalize="none" placeholder="Band id" />
        <Btn label="Add to band" tone="plain" onPress={shareBand} />
        <Btn label="Delete song" tone="danger" onPress={remove} />
      </>}
    </Body>
  </Screen>
}

function ViewAccess({ access, setAccess }: { access: 'view' | 'edit' | 'admin', setAccess: (access: 'view' | 'edit' | 'admin') => void }) {
  return <>
    <Btn label={`Access: ${access}`} tone="plain" onPress={() => setAccess(access === 'view' ? 'edit' : access === 'edit' ? 'admin' : 'view')} />
  </>
}
