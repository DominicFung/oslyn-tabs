import React, { useState } from 'react'
import { Text } from 'react-native'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { useTheme } from '../../src/theme'
import { Body, Btn, Card, Field, Notice, Screen } from '../ui'

type Track = { spotifyId: string, title: string, artist?: string | null, album?: string | null, albumCover?: string | null }

export default function ImportSong(p: {
  account: Account
  onBack: () => void
  onOpenSong: (songId: string) => void
}) {
  const { colors } = useTheme()
  const [term, setTerm] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [tracks, setTracks] = useState<Track[]>([])
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  const search = async () => {
    if (!term.trim()) return
    setBusy(true)
    setError('')
    const res = await gql<{ searchSpotifyTracks: { error?: string | null, tracks?: Track[] | null } | null }>(
      d.searchSpotifyTracks,
      { userId: p.account.userId, term: term.trim(), limit: 8 }
    )
    setBusy(false)
    if (!res.data?.searchSpotifyTracks) { setError(res.error || 'Spotify search failed.'); return }
    if (res.data.searchSpotifyTracks.error) setError(res.data.searchSpotifyTracks.error)
    setTracks(res.data.searchSpotifyTracks.tracks || [])
  }

  const queue = async (input: { title: string, artist?: string | null, album?: string | null, albumCover?: string | null, spotifyId?: string | null }) => {
    if (!input.title.trim()) { setError('A title is required.'); return }
    setBusy(true)
    setError('')
    setInfo('')
    const userId = p.account.userId
    const created = await gql<{ createSong: { songId: string } | null }>(d.createSong, {
      title: input.title.trim(),
      userId,
      artist: input.artist || undefined,
      album: input.album || undefined,
      albumCover: input.albumCover || undefined,
      chordSheet: ' ',
      chordSheetKey: 'C',
      spotifyId: input.spotifyId || undefined,
      originPlatorm: 'UG',
    })
    const songId = created.data?.createSong?.songId
    if (!songId) { setBusy(false); setError(created.error || 'Could not save the song.'); return }

    const set = await gql<{ createSet: { setListId: string } | null }>(d.createSet, {
      userId,
      description: `${input.title.trim()} import`,
      songs: [{ songId, key: 'C', order: 0 }],
    })
    const setListId = set.data?.createSet?.setListId
    if (!setListId) { setBusy(false); setError(set.error || 'Saved the song, but could not make a set for the importer.'); return }

    const jam = await gql<{ createJamSession: { jamSessionId: string } | null }>(d.createJamSession, {
      setListId,
      userId,
      policy: 'PRIVATE',
      description: `${input.title.trim()} import`,
    })
    const jamId = jam.data?.createJamSession?.jamSessionId
    if (!jamId) { setBusy(false); setError(jam.error || 'Saved the song, but could not open an import room.'); return }

    const queued = await gql<{ createChordImport: { requestId: string } | null }>(d.createChordImport, {
      userId,
      songId,
      jamId,
      title: input.title.trim(),
      artist: input.artist || undefined,
    })
    setBusy(false)
    if (!queued.data?.createChordImport) {
      setError(queued.error || 'The song is saved, but the Ultimate Guitar import was not queued. Turn the importer on from the website profile.')
      return
    }
    setInfo(`Queued ${input.title.trim()}. The importer fills the chord sheet while it is running.`)
    p.onOpenSong(songId)
  }

  return <Screen title="Import" subtitle="Spotify metadata, Ultimate Guitar chords" onBack={p.onBack}>
    <Body>
      <Field label="Spotify search" value={term} onChangeText={setTerm} autoCapitalize="none" placeholder="Song and artist" />
      <Btn label="Search Spotify" onPress={search} busy={busy} />
      {tracks.map((track) => <Card key={track.spotifyId}>
        <Text style={{ color: colors.text, fontWeight: '700' }}>{track.title}</Text>
        <Text style={{ color: colors.muted }}>{track.artist}</Text>
        <Btn label="Import chords" onPress={() => queue(track)} />
      </Card>)}
      <Field label="Or a title" value={title} onChangeText={setTitle} />
      <Field label="Artist" value={artist} onChangeText={setArtist} />
      <Btn label="Queue Ultimate Guitar import" tone="plain" onPress={() => queue({ title, artist })} busy={busy} />
      <Notice text={error} tone="error" />
      <Notice text={info} />
      <Text style={{ color: colors.muted }}>
        The import worker has to be running. Only the importer admin can switch it on, and that switch stays on the website because the phone cannot sign that request.
      </Text>
    </Body>
  </Screen>
}
