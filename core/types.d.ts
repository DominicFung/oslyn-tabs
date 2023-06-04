export interface _Song {
  sections: _Section[]
}

export interface _Section {
  name: string
  chords: _Chord[]
}

interface _Chord {
  chord: string
  duration: number | null
  start: number
  end: number
}

interface OslynSong {
  meta: any
  song: OslynPhrase[]
}

interface OslynPhrase {
  lyric: string,
  section: string,
  chords: OslynChord[]
  phrase: number
  phraseDuration: number|null
  start: number|null
}

interface OslynChord {
  chord: number,
  isMinor: boolean,
  beats: number|null,
  position: number,
  meta: { start: number, end: number }
}