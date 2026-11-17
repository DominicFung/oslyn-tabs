import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { addSongToLiveJam, createChordImport, createSongFromSpotify, JamSongChange } from '@/core/graphql/jam'

Amplify.configure(amplifyconfig, { ssr: true })

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: jamSessionId } = await context.params
  let title = ''
  let artist = ''
  let album = ''
  let albumCover = ''
  let spotifyId = ''
  try {
    const body = await request.json()
    title = typeof body?.title === 'string' ? body.title.trim() : ''
    artist = typeof body?.artist === 'string' ? body.artist.trim() : ''
    album = typeof body?.album === 'string' ? body.album.trim() : ''
    albumCover = typeof body?.albumCover === 'string' ? body.albumCover.trim() : ''
    spotifyId = typeof body?.spotifyId === 'string' ? body.spotifyId.trim() : ''
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (!title || !spotifyId) return NextResponse.json({ error: 'title and spotifyId are required' }, { status: 400 })

  const client = generateClient()
  let songId = ''
  try {
    const created = await client.graphql({
      query: createSongFromSpotify,
      variables: {
        title,
        userId,
        artist: artist || undefined,
        album: album || undefined,
        albumCover: albumCover || undefined,
        chordSheet: '',
        chordSheetKey: 'C',
        spotifyId,
        originPlatorm: 'OTHER',
      },
    }) as GraphQLResult<{ createSong: { songId: string } }>
    songId = created.data?.createSong?.songId || ''
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Could not save the song to your library' }, { status: 500 })
  }
  if (!songId) return NextResponse.json({ error: 'Could not save the song to your library' }, { status: 500 })

  try {
    const added = await client.graphql({
      query: addSongToLiveJam,
      variables: { jamSessionId, songId, key: 'C', userId, jumpTo: true },
    }) as GraphQLResult<{ addSongToLiveJam: JamSongChange | null }>
    if (!added.data?.addSongToLiveJam) {
      return NextResponse.json({
        error: 'Saved the song to your library, but could not add it to the jam',
        songId,
      }, { status: 403 })
    }
    let importRequestId: string | null = null
    try {
      const queued = await client.graphql({
        query: createChordImport,
        variables: { userId, songId, jamId: jamSessionId, title, artist: artist || undefined },
      }) as GraphQLResult<{ createChordImport: { requestId: string } | null }>
      importRequestId = queued.data?.createChordImport?.requestId || null
    } catch (e) {
      console.error(e)
    }
    return NextResponse.json({ ...added.data.addSongToLiveJam, songId, importRequestId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({
      error: 'Saved the song to your library, but could not add it to the jam',
      songId,
    }, { status: 500 })
  }
}
