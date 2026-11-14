import { NextResponse } from 'next/server'

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/core/auth'
import { _Session } from '@/core/utils/frontend'
import { cleanChordSheetCompletion, cleanedChordSheetText } from '@/core/cleanChordSheet'

const MAX_SHEET = 200_000

/** Cleans a chord sheet before a song exists. Does not create a song. */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!(session?.user as _Session)?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let chordSheet = ''
  try {
    const body = await request.json()
    chordSheet = typeof body?.chordSheet === 'string' ? body.chordSheet : ''
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!chordSheet.trim()) return NextResponse.json({ error: 'Chord sheet is required' }, { status: 400 })
  if (chordSheet.length > MAX_SHEET) return NextResponse.json({ error: 'Chord sheet is too long' }, { status: 400 })

  try {
    const completion = await cleanChordSheetCompletion(chordSheet)
    return NextResponse.json({ chordSheet: cleanedChordSheetText(completion, chordSheet) })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Could not clean the chord sheet' }, { status: 502 })
  }
}
