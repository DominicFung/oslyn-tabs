import { NextResponse } from 'next/server'

import { Amplify } from 'aws-amplify'
import { GraphQLResult, generateClient } from 'aws-amplify/api'
import amplifyconfig from '@/../src/amplifyconfiguration.json'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { addSongToLiveJam, createSongForLibrary, JamSongChange } from '@/core/graphql/jam'
import { cleanChordSheetCompletion, cleanedChordSheetText } from '@/core/cleanChordSheet'

Amplify.configure(amplifyconfig, { ssr: true })

const MAX_SHEET = 200_000

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  const userId = (session?.user as _Session)?.userId
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: jamSessionId } = await context.params
  let title = ''
  let artist = ''
  let key = ''
  let chordSheet = ''
  let jumpTo = true
  try {
    const body = await request.json()
    title = typeof body?.title === 'string' ? body.title.trim() : ''
    artist = typeof body?.artist === 'string' ? body.artist.trim() : ''
    key = typeof body?.key === 'string' ? body.key.trim() : ''
    chordSheet = typeof body?.chordSheet === 'string' ? body.chordSheet : ''
    jumpTo = body?.jumpTo !== false
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!title || !key || !chordSheet.trim()) {
    return NextResponse.json({ error: 'Title, key, and chord sheet are required' }, { status: 400 })
  }
  if (chordSheet.length > MAX_SHEET) {
    return NextResponse.json({ error: 'Chord sheet is too long' }, { status: 400 })
  }

  let cleaned = chordSheet
  try {
    const completion = await cleanChordSheetCompletion(chordSheet)
    cleaned = cleanedChordSheetText(completion, chordSheet)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Could not clean the chord sheet' }, { status: 502 })
  }

  Amplify.configure(amplifyconfig, { ssr: true })
  const client = generateClient()

  let songId = ''
  try {
    const created = await client.graphql({
      query: createSongForLibrary,
      variables: {
        title,
        userId,
        artist: artist || undefined,
        chordSheet: cleaned,
        chordSheetKey: key,
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
      variables: { jamSessionId, songId, key, userId, jumpTo },
    }) as GraphQLResult<{ addSongToLiveJam: JamSongChange | null }>

    if (!added.data?.addSongToLiveJam) {
      return NextResponse.json({
        error: 'Saved the song to your library, but could not add it to the jam',
        songId,
      }, { status: 403 })
    }
    return NextResponse.json({ ...added.data.addSongToLiveJam, songId })
  } catch (e) {
    console.error(e)
    return NextResponse.json({
      error: 'Saved the song to your library, but could not add it to the jam',
      songId,
    }, { status: 500 })
  }
}
