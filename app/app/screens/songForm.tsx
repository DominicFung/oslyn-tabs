import React, { useState } from 'react'
import { gql } from '../../src/graphql/client'
import * as d from '../../src/graphql/documents'
import { Account } from '../../src/session'
import { Body, Btn, Field, Keys, Notice, Screen } from '../ui'
import { SongRow } from './songs'

export default function SongForm(p: {
  account: Account
  song?: SongRow & { chordSheet?: string | null, originLink?: string | null }
  onBack: () => void
  onSaved: (songId: string) => void
}) {
  const editing = !!p.song?.songId
  const [title, setTitle] = useState(p.song?.title || '')
  const [artist, setArtist] = useState(p.song?.artist || '')
  const [album, setAlbum] = useState(p.song?.album || '')
  const [cover, setCover] = useState(p.song?.albumCover || '')
  const [keyName, setKeyName] = useState(p.song?.chordSheetKey || 'C')
  const [sheet, setSheet] = useState(p.song?.chordSheet || '')
  const [link, setLink] = useState(p.song?.originLink || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const lookup = async () => {
    if (!title.trim()) return
    setBusy(true)
    const res = await gql<{ searchSpotifyTracks: { error?: string | null, tracks?: { album?: string | null, albumCover?: string | null }[] | null } | null }>(
      d.searchSpotifyTracks,
      { userId: p.account.userId, term: `${title} ${artist}`.trim(), limit: 1 }
    )
    setBusy(false)
    const track = res.data?.searchSpotifyTracks?.tracks?.[0]
    if (!track) { setError(res.data?.searchSpotifyTracks?.error || res.error || 'No Spotify match.'); return }
    if (!album && track.album) setAlbum(track.album)
    if (!cover && track.albumCover) setCover(track.albumCover)
  }

  const save = async () => {
    if (!title.trim() || !sheet.trim() || !keyName) {
      setError('Title, key, and chord sheet are required.')
      return
    }
    setBusy(true)
    setError('')
    if (editing && p.song) {
      const res = await gql<{ updateSong: { songId: string } | null }>(d.updateSong, {
        songId: p.song.songId,
        userId: p.account.userId,
        title: title.trim(),
        artist: artist.trim() || undefined,
        album: album.trim() || undefined,
        albumCover: cover.trim() || undefined,
        chordSheet: sheet,
        chordSheetKey: keyName,
        originalLink: link.trim() || undefined,
      })
      setBusy(false)
      if (!res.data?.updateSong) { setError(res.error || 'Could not save the song.'); return }
      p.onSaved(res.data.updateSong.songId)
      return
    }
    const res = await gql<{ createSong: { songId: string } | null }>(d.createSong, {
      title: title.trim(),
      userId: p.account.userId,
      artist: artist.trim() || undefined,
      album: album.trim() || undefined,
      albumCover: cover.trim() || undefined,
      chordSheet: sheet,
      chordSheetKey: keyName,
      originPlatorm: link.includes('ultimate-guitar') ? 'UG' : 'OTHER',
      originLink: link.trim() || undefined,
    })
    setBusy(false)
    if (!res.data?.createSong) { setError(res.error || 'Could not create the song.'); return }
    p.onSaved(res.data.createSong.songId)
  }

  return <Screen title={editing ? 'Edit song' : 'New song'} onBack={p.onBack}>
    <Body>
      <Field label="Title" value={title} onChangeText={setTitle} />
      <Field label="Artist" value={artist} onChangeText={setArtist} />
      <Field label="Album" value={album} onChangeText={setAlbum} />
      <Field label="Cover image URL" value={cover} onChangeText={setCover} autoCapitalize="none" />
      <Btn label="Look up album on Spotify" tone="plain" onPress={lookup} busy={busy} />
      <Keys value={keyName} onChange={setKeyName} />
      <Field label="Chord sheet" value={sheet} onChangeText={setSheet} multiline placeholder={'[Verse]\nG  D  Em  C'} />
      <Field label="Source link" value={link} onChangeText={setLink} autoCapitalize="none" placeholder="https://tabs.ultimate-guitar.com/..." />
      <Notice text={error} tone="error" />
      <Btn label="Save" onPress={save} busy={busy} />
    </Body>
  </Screen>
}
