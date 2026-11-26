import React, { useEffect, useState } from 'react'
import { Image, Linking, Pressable, Text, TextInput, View } from 'react-native'
import { JamSong } from '../../../src/API'
import { gql } from '../../../src/graphql/client'
import * as d from '../../../src/graphql/documents'
import {
  chordSiteLinks,
  JamSongChange,
  PlaylistUpdate,
  shouldSearchSpotify,
  spotifyTrackUrl,
} from '../../../src/jamPlaylist'
import { SONG_KEYS } from '../../../src/sessionSteps'
import { useTheme } from '../../../src/theme'

type LibrarySong = {
  songId: string
  title: string
  artist?: string | null
  album?: string | null
  albumCover?: string | null
  chordSheetKey?: string | null
}

type SpotifyTrack = {
  spotifyId: string
  title: string
  artist?: string | null
  album?: string | null
  albumCover?: string | null
}

type SetRow = { song: JamSong, setIndex: number }

interface SongProps {
  jamSessionId: string
  song: number
  setSong: (n: number) => void
  addToQueue?: (songId: string) => void
  songs: JamSong[]
  canAddSongs?: boolean
  userId?: string
  onSongAdded?: (change: JamSongChange) => void
  onSongRemoved?: (update: PlaylistUpdate) => void
  queueAt?: (index: number) => void
}

export default function Songs(p: SongProps) {
  const { colors } = useTheme()
  const [search, setSearch] = useState('')
  const [filteredList, setFilteredList] = useState<SetRow[]>([])
  const [library, setLibrary] = useState<LibrarySong[]>([])
  const [libraryState, setLibraryState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [spotify, setSpotify] = useState<SpotifyTrack[]>([])
  const [spotifyState, setSpotifyState] = useState<'idle' | 'loading' | 'done' | 'hidden'>('idle')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [artist, setArtist] = useState('')
  const [pasteKey, setPasteKey] = useState('C')
  const [chordSheet, setChordSheet] = useState('')

  useEffect(() => {
    const words = search.toLowerCase().trim().split(/[\s,]+/).filter((word) => word.length > 0)
    const rows = p.songs.map((song, setIndex) => ({ song, setIndex }))
    if (words.length === 0) {
      setFilteredList(rows)
      return
    }
    setFilteredList(rows.filter(({ song }) => {
      const name = song.song?.title?.toLowerCase().trim() || ''
      const by = song.song?.artist?.toLowerCase().trim() || ''
      return words.some((word) => name.includes(word) || by.includes(word))
    }))
  }, [search, p.songs])

  useEffect(() => {
    if (!p.canAddSongs || !p.userId) {
      setLibrary((prev) => prev.length ? [] : prev)
      setLibraryState((prev) => prev === 'idle' ? prev : 'idle')
      return
    }
    const query = search.trim()
    if (query.length < 2) {
      setLibrary((prev) => prev.length ? [] : prev)
      setLibraryState((prev) => prev === 'idle' ? prev : 'idle')
      return
    }
    setLibraryState('loading')
    const handle = setTimeout(async () => {
      const res = await gql<{ searchSongs: LibrarySong[] | null }>(d.searchSongs, { userId: p.userId, query })
      if (res.error && !res.data) {
        setLibrary([])
        setLibraryState('error')
        return
      }
      setLibrary(res.data?.searchSongs || [])
      setLibraryState('done')
    }, 300)
    return () => clearTimeout(handle)
  }, [search, p.canAddSongs, p.userId])

  useEffect(() => {
    if (!shouldSearchSpotify(!!p.canAddSongs && !!p.userId, search, libraryState, library.length)) {
      setSpotify((prev) => prev.length ? [] : prev)
      setSpotifyState((prev) => (prev === 'loading' || prev === 'done') ? 'idle' : prev)
      return
    }
    setSpotifyState('loading')
    const handle = setTimeout(async () => {
      const res = await gql<{ searchSpotifyTracks: { tracks: SpotifyTrack[] | null, error?: string | null } | null }>(
        d.searchSpotifyTracks,
        { userId: p.userId, term: search.trim(), limit: 5 },
      )
      const payload = res.data?.searchSpotifyTracks
      if ((res.error && !payload) || payload?.error) {
        setSpotify([])
        setSpotifyState('hidden')
        return
      }
      setSpotify(payload?.tracks || [])
      setSpotifyState('done')
    }, 300)
    return () => clearTimeout(handle)
  }, [search, p.canAddSongs, p.userId, libraryState, library.length])

  const addSpotifyTrack = async (track: SpotifyTrack) => {
    if (!p.userId || busy) return
    setBusy(`spotify:${track.spotifyId}`)
    setError('')
    const created = await gql<{ createSong: { songId: string } | null }>(d.createSong, {
      title: track.title,
      userId: p.userId,
      artist: track.artist || undefined,
      album: track.album || undefined,
      albumCover: track.albumCover || undefined,
      chordSheet: '',
      chordSheetKey: 'C',
      spotifyId: track.spotifyId,
      originPlatorm: 'OTHER',
    })
    const songId = created.data?.createSong?.songId
    if (!songId) {
      setError(created.error || 'Could not save the song to your library')
      setBusy('')
      return
    }
    const added = await gql<{ addSongToLiveJam: JamSongChange | null }>(d.addSongToLiveJam, {
      jamSessionId: p.jamSessionId,
      songId,
      key: 'C',
      userId: p.userId,
      jumpTo: true,
    })
    if (!added.data?.addSongToLiveJam?.song?.songId) {
      setError(added.error || 'Saved the song to your library, but could not add it to the jam')
      setBusy('')
      return
    }
    p.onSongAdded?.(added.data.addSongToLiveJam)
    await gql(d.createChordImport, {
      userId: p.userId,
      songId,
      jamId: p.jamSessionId,
      title: track.title,
      artist: track.artist || undefined,
    })
    setSearch('')
    setBusy('')
  }

  const addLibrarySong = async (hit: LibrarySong, jumpTo: boolean) => {
    const existing = p.songs.findIndex((row) => row.song?.songId === hit.songId)
    if (existing >= 0) {
      if (jumpTo) p.setSong(existing)
      else p.addToQueue?.(hit.songId)
      return
    }
    if (!p.userId || busy) return
    setBusy(`${hit.songId}:${jumpTo ? 'play' : 'queue'}`)
    setError('')
    const added = await gql<{ addSongToLiveJam: JamSongChange | null }>(d.addSongToLiveJam, {
      jamSessionId: p.jamSessionId,
      songId: hit.songId,
      key: hit.chordSheetKey || 'C',
      userId: p.userId,
      jumpTo,
    })
    const change = added.data?.addSongToLiveJam
    if (change?.index == null) {
      setError(added.error || 'Could not add that song')
      setBusy('')
      return
    }
    p.onSongAdded?.(change)
    if (!jumpTo) await p.queueAt?.(change.index)
    setSearch('')
    setBusy('')
  }

  const removeFromJam = async (row: SetRow) => {
    const songId = row.song.song?.songId
    if (!songId || !p.userId || busy) return
    setBusy(`remove:${songId}`)
    setError('')
    const res = await gql<{ removeSongFromJam: PlaylistUpdate | null }>(d.removeSongFromJam, {
      jamSessionId: p.jamSessionId,
      songId,
      userId: p.userId,
      index: row.setIndex,
    })
    if (!res.data?.removeSongFromJam) {
      setError(res.error || 'Could not remove that song')
      setBusy('')
      return
    }
    p.onSongRemoved?.(res.data.removeSongFromJam)
    setBusy('')
  }

  const paste = async () => {
    if (!p.userId || busy || !title.trim() || !chordSheet.trim()) return
    setBusy('paste')
    setError('')
    const created = await gql<{ createSong: { songId: string } | null }>(d.createSong, {
      title: title.trim(),
      userId: p.userId,
      artist: artist.trim() || undefined,
      chordSheet,
      chordSheetKey: pasteKey,
      originPlatorm: 'OTHER',
    })
    const songId = created.data?.createSong?.songId
    if (!songId) {
      setError(created.error || 'Could not save the song to your library')
      setBusy('')
      return
    }
    const added = await gql<{ addSongToLiveJam: JamSongChange | null }>(d.addSongToLiveJam, {
      jamSessionId: p.jamSessionId,
      songId,
      key: pasteKey,
      userId: p.userId,
      jumpTo: true,
    })
    if (!added.data?.addSongToLiveJam?.song?.songId) {
      setError(added.error || 'Could not add the chord sheet')
      setBusy('')
      return
    }
    p.onSongAdded?.(added.data.addSongToLiveJam)
    setTitle('')
    setArtist('')
    setChordSheet('')
    setSearch('')
    setBusy('')
  }

  const nothingInJam = search.trim().length >= 2 && filteredList.length === 0
  const nothingInLibrary = !!p.canAddSongs && libraryState === 'done' && library.length === 0
  const showMiss = nothingInJam && (!p.canAddSongs || nothingInLibrary || libraryState === 'error')
  const links = chordSiteLinks(search)

  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  }

  return <View>
    <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: 6 }}>Song</Text>
    <Text style={{ color: colors.text, marginBottom: 12 }}>
      Choose a new Song!{' '}
      <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted }}>Note: this affects everyone in the session.</Text>
    </Text>
    <TextInput
      value={search}
      onChangeText={setSearch}
      placeholder="Holy Forever ..."
      placeholderTextColor={colors.muted}
      autoCapitalize="none"
      autoCorrect={false}
      style={inputStyle}
    />

    {filteredList.length === 0 && search.trim() === '' && <Text style={{ color: colors.muted, marginBottom: 8 }}>Search for a song to start</Text>}

    {filteredList.map((row) => {
      const song = row.song.song
      if (!song) return null
      return <View key={`${row.setIndex}-${song.songId}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Pressable onPress={() => p.setSong(row.setIndex)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {song.albumCover ? <Image source={{ uri: song.albumCover }} style={{ width: 32, height: 32, borderRadius: 16 }} /> : <View style={{ width: 32 }} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.text }}>{song.title}</Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>{song.artist} | {song.album}</Text>
          </View>
          <Text style={{ color: colors.text, fontWeight: '700' }}>{row.song.key}</Text>
        </Pressable>
        {p.canAddSongs && song.songId ? <Pressable disabled={!!busy} onPress={() => removeFromJam(row)} style={{ borderWidth: 1, borderColor: colors.danger, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }}>
          <Text style={{ color: colors.danger, fontSize: 12 }}>{busy === `remove:${song.songId}` ? 'Removing…' : 'Remove'}</Text>
        </Pressable> : null}
        {p.addToQueue && song.songId ? <Pressable accessibilityLabel="Add to queue" onPress={() => p.addToQueue!(song.songId)} style={{ backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
          <Text style={{ color: colors.accentText, fontWeight: '700' }}>+</Text>
        </Pressable> : null}
      </View>
    })}

    {p.canAddSongs && search.trim().length >= 2 && <View style={{ marginTop: 16 }}>
      <Text style={{ fontSize: 12, letterSpacing: 0.5, color: colors.muted, marginBottom: 6 }}>YOUR SONGS</Text>
      {libraryState === 'loading' && <Text style={{ color: colors.muted }}>Searching…</Text>}
      {libraryState === 'error' && <Text style={{ color: colors.danger }}>Search failed. You can still paste a chart below.</Text>}
      {library.map((hit) => {
        const inJam = p.songs.some((row) => row.song?.songId === hit.songId)
        return <View key={hit.songId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.text }}>{hit.title}</Text>
            <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>{hit.artist || 'Unknown artist'}{inJam ? ' · In this jam' : ''}</Text>
          </View>
          <Pressable disabled={!!busy} onPress={() => addLibrarySong(hit, true)} style={{ backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
            <Text style={{ color: colors.accentText, fontSize: 12 }}>{busy === `${hit.songId}:play` ? 'Adding…' : 'Play'}</Text>
          </Pressable>
          <Pressable disabled={!!busy} onPress={() => addLibrarySong(hit, false)} style={{ borderWidth: 1, borderColor: colors.accent, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 }}>
            <Text style={{ color: colors.accent, fontSize: 12 }}>{busy === `${hit.songId}:queue` ? 'Adding…' : 'Queue'}</Text>
          </Pressable>
        </View>
      })}
    </View>}

    {p.canAddSongs && spotifyState !== 'idle' && spotifyState !== 'hidden' && <View style={{ marginTop: 16 }}>
      <Text style={{ fontSize: 12, letterSpacing: 0.5, color: colors.muted, marginBottom: 6 }}>SPOTIFY</Text>
      {spotifyState === 'loading' && <Text style={{ color: colors.muted }}>Searching Spotify…</Text>}
      {spotifyState === 'done' && spotify.length === 0 && <Text style={{ color: colors.muted }}>No Spotify matches.</Text>}
      {spotify.map((track) => <View key={track.spotifyId} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
        {track.albumCover ? <Image source={{ uri: track.albumCover }} style={{ width: 40, height: 40, borderRadius: 4 }} /> : null}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text numberOfLines={1} style={{ fontWeight: '700', color: colors.text }}>{track.title}</Text>
          <Text numberOfLines={1} style={{ color: colors.muted, fontSize: 13 }}>{track.artist || 'Unknown artist'}{track.album ? ` · ${track.album}` : ''}</Text>
        </View>
        <Pressable onPress={() => Linking.openURL(spotifyTrackUrl(track.spotifyId))} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: colors.accent, fontSize: 12 }}>Open</Text>
        </Pressable>
        <Pressable disabled={!!busy} onPress={() => addSpotifyTrack(track)} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
          <Text style={{ color: colors.accent, fontSize: 12 }}>{busy === `spotify:${track.spotifyId}` ? 'Adding…' : 'Add'}</Text>
        </Pressable>
      </View>)}
    </View>}

    {error ? <Text style={{ color: colors.danger, marginTop: 8 }}>{error}</Text> : null}

    {showMiss && <View style={{ marginTop: 16 }}>
      <Text style={{ color: colors.text }}>No songs matched “{search.trim()}”.</Text>
      {p.canAddSongs && <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          <Text style={{ color: colors.accent, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(links.ultimateGuitar)}>Find on Ultimate Guitar</Text>
          <Text style={{ color: colors.accent, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(links.worshipTogether)}>Find on Worship Together</Text>
        </View>
        <Text style={{ fontSize: 12, fontStyle: 'italic', color: colors.muted, marginTop: 6 }}>Opens in the browser. You can also paste a chart below.</Text>
        <Text style={{ fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 8 }}>Paste a chord sheet</Text>
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={colors.muted} style={inputStyle} />
        <TextInput value={artist} onChangeText={setArtist} placeholder="Artist" placeholderTextColor={colors.muted} style={inputStyle} />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
          {SONG_KEYS.map((key) => <Pressable key={key} onPress={() => setPasteKey(key)} style={{ paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: pasteKey === key ? colors.accent : colors.chip }}>
            <Text style={{ color: pasteKey === key ? colors.accentText : colors.text }}>{key}</Text>
          </Pressable>)}
        </View>
        <TextInput
          value={chordSheet}
          onChangeText={setChordSheet}
          placeholder={'[Verse 1]\nC            G\nAmazing grace'}
          placeholderTextColor={colors.muted}
          multiline
          style={[inputStyle, { minHeight: 120, textAlignVertical: 'top' }]}
        />
        <Pressable disabled={busy === 'paste' || !title.trim() || !chordSheet.trim()} onPress={paste} style={{ backgroundColor: colors.accent, borderRadius: 8, paddingVertical: 10, alignItems: 'center', opacity: !title.trim() || !chordSheet.trim() ? 0.6 : 1 }}>
          <Text style={{ color: colors.accentText, fontWeight: '700' }}>{busy === 'paste' ? 'Adding…' : 'Add to jam'}</Text>
        </Pressable>
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8 }}>Saved to your library and added to this jam. It is not made public.</Text>
      </>}
    </View>}
  </View>
}
