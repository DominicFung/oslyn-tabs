/** Same song payload the website posts to updateSet: array order is the set order. */
export function setSongInputs(songs: { songId: string, key: string }[]) {
  return songs.map((song, order) => ({ songId: song.songId, key: song.key, order }))
}

export function moveSong<T>(songs: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= songs.length || to >= songs.length) return songs
  const next = songs.slice()
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export const SET_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']

export function nextSetKey(key: string): string {
  const index = SET_KEYS.indexOf(key)
  return SET_KEYS[(index + 1) % SET_KEYS.length]
}
