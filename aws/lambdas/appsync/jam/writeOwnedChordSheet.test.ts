import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

process.env.JAM_TABLE_NAME = 'JamTable'
process.env.SETLIST_TABLE_NAME = 'SetTable'
process.env.SONG_TABLE_NAME = 'SongTable'

import { writeOwnedChordSheet } from './setLiveJamChordSheet'

const SONG = '0614cc4e-1aae-4b84-a319-b66945b38a6f'
const HOST = 'host-user'
const JAM = 'jam-1'

type Store = Record<string, Record<string, Record<string, unknown>>>

function client(store: Store) {
  const updates: string[] = []
  const send = jest.fn(async (command: { constructor: { name: string }, input: { TableName: string, Key?: Record<string, unknown>, UpdateExpression?: string } }) => {
    if (command.constructor.name === 'UpdateItemCommand') {
      updates.push(command.input.UpdateExpression || '')
      return {}
    }
    const key = unmarshall(command.input.Key || {})
    const id = String(key.jamSessionId || key.setListId || key.songId || '')
    const item = store[command.input.TableName]?.[id]
    return item ? { Item: marshall(item, { removeUndefinedValues: true }) } : {}
  })
  return { dynamo: { send } as never, updates }
}

function world(opts: { playlist?: unknown, queue?: unknown, setSongs?: { songId: string, key: string }[], owner?: string, host?: string, endDate?: number }) {
  const store: Store = {
    JamTable: {
      [JAM]: {
        jamSessionId: JAM,
        userId: opts.host ?? HOST,
        setListId: 'set-1',
        ...(opts.endDate ? { endDate: opts.endDate } : {}),
        ...(opts.playlist !== undefined ? { playlist: opts.playlist } : {}),
        ...(opts.queue !== undefined ? { queue: opts.queue } : {}),
      },
    },
    SetTable: {
      'set-1': { setListId: 'set-1', songs: opts.setSongs || [] },
    },
    SongTable: {
      [SONG]: { songId: SONG, userId: opts.owner ?? HOST, chordSheetKey: 'C', isApproved: false, version: 1 },
    },
  }
  return client(store)
}

describe('writeOwnedChordSheet', () => {
  // No Other Name - Live was only on the jam playlist, so the set lookup rejected it.
  it('writes a chart for a song that is on the playlist and not the set', async () => {
    const { dynamo, updates } = world({
      playlist: [{ songId: 'other', key: 'C' }, { songId: SONG, key: 'D' }],
      queue: [1],
      setSongs: [{ songId: 'other', key: 'C' }],
    })
    const written = await writeOwnedChordSheet(dynamo, {
      jamSessionId: JAM, songId: SONG, userId: HOST, chordSheet: 'G D Em C',
    })
    expect(written?.index).toBe(1)
    expect(written?.key).toBe('D')
    expect(updates.length).toBe(1)
  })

  // The queue stores indexes into that playlist, which is the live song list.
  it('writes a chart when the queue index points at the song', async () => {
    const { dynamo } = world({
      playlist: [{ songId: 'other', key: 'C' }, { songId: SONG, key: 'A' }],
      queue: [1],
      setSongs: [],
    })
    const written = await writeOwnedChordSheet(dynamo, {
      jamSessionId: JAM, songId: SONG, userId: HOST, chordSheet: 'A D E',
    })
    expect(written?.index).toBe(1)
    expect(written?.song.chordSheet).toBe('A D E')
  })

  // A song left only on the set after the playlist dropped it is not in the room.
  it('rejects a song that is not on the live playlist or queue', async () => {
    const { dynamo, updates } = world({
      playlist: [{ songId: 'other', key: 'C' }],
      queue: [0],
      setSongs: [{ songId: SONG, key: 'G' }],
    })
    const written = await writeOwnedChordSheet(dynamo, {
      jamSessionId: JAM, songId: SONG, userId: HOST, chordSheet: 'G C D',
    })
    expect(written).toBeUndefined()
    expect(updates).toEqual([])
  })

  // Host and admin checks stay in front of the playlist lookup.
  it('rejects a user who cannot edit the jam', async () => {
    const { dynamo, updates } = world({
      playlist: [{ songId: SONG, key: 'C' }],
      host: 'someone-else',
    })
    const written = await writeOwnedChordSheet(dynamo, {
      jamSessionId: JAM, songId: SONG, userId: HOST, chordSheet: 'C G Am F',
    })
    expect(written).toBeUndefined()
    expect(updates).toEqual([])
  })

  // The caller still has to own the song.
  it('rejects a chart for a song the caller does not own', async () => {
    const { dynamo, updates } = world({
      playlist: [{ songId: SONG, key: 'C' }],
      owner: 'other-owner',
    })
    const written = await writeOwnedChordSheet(dynamo, {
      jamSessionId: JAM, songId: SONG, userId: HOST, chordSheet: 'C G Am F',
    })
    expect(written).toBeUndefined()
    expect(updates).toEqual([])
  })
})
