import { resolveNextSong } from './nextSong'

const playlist = [
  { songId: '935197ff', key: 'C' },
  { songId: '0614cc4e-1aae-4b84-a319-b66945b38a6f', key: 'C' },
  { songId: '37cef198', key: 'C' },
  { songId: '7494a517', key: 'C' },
  { songId: '17eb5cb3', key: 'C' },
  { songId: 'c53547bb', key: 'C' },
  { songId: 'b464efc2', key: 'C' },
]

describe('resolveNextSong', () => {
  // The live list was the playlist. nextSong looked at the shorter set and returned null for index 2.
  it('moves off playlist index 1 even when the set does not have that many songs', () => {
    const setSongs = [{ songId: '935197ff', key: 'C' }]
    const chosen = resolveNextSong({
      requestedSong: 2,
      currentSong: 1,
      queue: [],
      setSongs,
      playlist,
    })
    expect(chosen).toEqual({ song: 2, page: 0, key: 'C', queue: [] })
  })

  it('advances to the next playlist song when the arrow omits an index', () => {
    const chosen = resolveNextSong({
      requestedSong: null,
      currentSong: 1,
      queue: [],
      setSongs: [{ songId: '935197ff', key: 'C' }],
      playlist,
    })
    expect(chosen?.song).toBe(2)
  })

  it('uses the set when the jam has no playlist', () => {
    const chosen = resolveNextSong({
      requestedSong: null,
      currentSong: 0,
      queue: [],
      setSongs: [{ songId: 'a', key: 'G' }, { songId: 'b', key: 'D' }],
    })
    expect(chosen).toEqual({ song: 1, page: 0, key: 'D', queue: [] })
  })

  it('still rejects an index past the live list', () => {
    expect(resolveNextSong({
      requestedSong: 9,
      currentSong: 1,
      queue: [],
      setSongs: [],
      playlist,
    })).toBeNull()
  })
})
