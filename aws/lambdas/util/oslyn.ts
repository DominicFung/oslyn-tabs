import { _Section, _Song, _Chord, OslynPhrase, OslynSong, OslynChord } from './types'

const chordRegexForTextBlock = "(^| |\n)([A-Ga-g](##?|bb?)?(m|M)?[2-9]?(sus|maj|min|aug|dim)?[2-9]?(\/[A-G](##?|bb?)?)?)(\n| |$)"
const chordRegex =  "^([A-Ga-g](##?|bb?)?(m|M)?[2-9]?(sus|maj|min|aug|dim)?[2-9]?(\/[A-G](##?|bb?)?)?)$"
const keyRegex = "^[A-Ga-g](##?|bb?)?$"
//const sectionRegexForTextBlock = "\\[[^\n]*\\]"

const KeyDistanceMap = [
  [ 'A',          'G##', 'Bbb' ],
  [ 'Bb', 'A#',          'Cbb' ],
  [ 'B',  'Cb',   'A##',       ],
  [ 'C',  'B#',                ],
  [ 'C#', 'Db',   'B##',       ],
  [ 'D',          'C##', 'Ebb' ],
  [ 'Eb', 'D#',          'Fbb' ],
  [ 'E',  'Fb',   'D##',       ],
  [ 'F',  'E#',          'Gbb' ],
  [ 'F#', 'Gb',   'E##',       ],
  [ 'G',          'F##', 'Abb' ],
  [ 'Ab', 'G#',                ],
]

const isChordLine = (line: string): boolean => {
  let tempLine = line.trim().replace(/\s\s+/g, ' ').split(' ')
  let numOfChords = 0
  let numOfNonChords = 0

  for (let item of tempLine) {
    if (!new RegExp(chordRegex).test(item)) {
      numOfNonChords = numOfNonChords + 1
    } else numOfChords = numOfChords + 1
  }

  //console.log(`"${line}" ${numOfChords} vs ${numOfNonChords}`)
  if (numOfChords >= numOfNonChords) return true
  else return false
}

const getSectionName = (line: string): string => {
  let temp = line.split("[")
  return temp[temp.length-1].split("]")[0]
}

export const getLineType = (line: string): 'chord'|'lyric'|'annotation'|'blank' => {
  if (isChordLine(line)) { /*console.log(`getLineType() "${line}" chord`);*/ return 'chord' }
  else if (line.trim().replace(/\s\s+/g, ' ') === ' ') return 'blank'
  else if (line.trim().replace(/\s\s+/g, '').startsWith('[') &&
          line.trim().replace(/\s\s+/g, '').startsWith('[')) return 'annotation'
  else return 'lyric'
}

export const getIsMinor = (chord: string): boolean => {
  chord = chord.split(/(sus|maj|min|aug|dim)/g)[0]
  if (chord.toLowerCase().endsWith('m')) return true
  else if (chord.toLowerCase().endsWith('m7')) return true
  else return false
}

const stripChordToKey = (chord: string): string|null => {
  /**
   * Chords can look like the following: C, Cm, Cmdim7, C/G, etc.
   *   1. split by [sus, maj, min, aug, dim, "/"], take the first char
   *   2. split by m or M, remove the minor
   *   3. some chords then are followed by a number ex. C2
   *   4. (optional) check that the chord looks like what we expect
   */

   chord = chord.split(/(sus|maj|min|aug|dim|\/)/g)[0]
   chord = chord.split(/(M|m)/g)[0]
   chord = chord.replace(/[0-9]/g, '')
   if (new RegExp(keyRegex, 'g').test(chord)) return chord
   else { console.warn(`stripChordToKey(${chord}) could not be stripped.`); return null}
}

const distanceFromKey = (chord: string, key: string): number|null => {
  let schord
  if (!new RegExp(keyRegex, 'g').test(key)) return null
  if (!(schord = stripChordToKey(chord))) return null

  for (let i=0; i<KeyDistanceMap.length; i++) {
    if (KeyDistanceMap[i].includes(key)) {
      let index = i
      let p = 0
      
      while (p < 12) {
        if (KeyDistanceMap[index].includes(schord)) return p

        if (index + 1 < KeyDistanceMap.length ) index++
        else index = 0

        p++
      }
    }
  }

  console.log("distanceFromKey(): Could not find chord -> key distance, returning null ..")
  return null
}

export const rawChordsheetToIntermediaryJson = (text: string): _Song => {
  let intermediaryJson = { sections: [] } as _Song
  let index = 0
  let currentSection = { name: "", chords: [] } as _Section

  let textArray = text.split("\n")
  //console.log(text)
  //console.log(pTextArray)

  for (let i=0; i<textArray.length; i++) {
    let line = textArray[i]

    let lineType = getLineType(line)
    if (lineType === 'chord') {
      //console.log(`${lineType} "${pline}"`)
      let matchArr, start, end
      let regex = new RegExp(chordRegexForTextBlock, 'g')

      while ((matchArr = regex.exec(line)) !== null) {
        start = index + matchArr.index
        end = start + matchArr[0].length

        //chrordStrategy regex matches \n at the beginning & end of line. string.trim() cuts them out
        if (matchArr.index === 0) start = start - 1
        if (matchArr.index + matchArr[0].length === textArray[i].length) end = end + 1

        //console.log(`${currentSection.name} ${matchArr[0]}-${start}-${end} || ${matchArr.index + matchArr[0].length} : ${textArray[i].length}`)
        currentSection.chords.push({
          chord: matchArr[0].trim(),
          start, end, duration: null
        } as _Chord)
      }
    } else if (lineType === 'annotation') {
      if (currentSection.chords.length === 0 && currentSection.name === "") {
        currentSection.name = getSectionName(line)
      } else if (currentSection.chords.length === 0) {
        console.warn(`We've detected an empty section: ${currentSection.name}`)
        intermediaryJson.sections.push(currentSection)
        currentSection = { 
          name: getSectionName(line),
          chords: []
        } as _Section
      } else {
        intermediaryJson.sections.push(currentSection)
        currentSection = { 
          name: getSectionName(line),
          chords: []
        } as _Section
      }
    }

    index = index + line.length + 1 // for \n ,, since that gets cut by trim(\n)
  }

  intermediaryJson.sections.push(currentSection)
  //console.log(JSON.stringify(intermediaryJson))
  return intermediaryJson
}

/**
 * 
 * @param text            Mono format text! We should not need to recalculate - use directly from DB
 * @param intermediary    IntermediaryJson from Step1
 * @param key             Key from Step0 submitted by user
 */
export const convertOslynSong = (text: string, intermediary: _Song, key: string): OslynSong => {
  let textArray = text.split("\n")
  //let ptext = convertToProportionalFont(text)
  
  let oslynSongJson = {
    meta: {},
    song: [] as OslynPhrase[]
  } as OslynSong

  let p = 0 // currentPhraseNumber
  let currentIntermediaryJasonSection = intermediary.sections[p] as _Section

  let c = 0 // currentChord

  for (let i=0; i<textArray.length; i++) {
    let line = textArray[i]
    let lineType = getLineType(line)

    if (lineType === 'chord') {
      var lyricLine = ""
      if (i<textArray.length-1 && getLineType(textArray[i+1]) === 'lyric') {
        lyricLine = textArray[i+1]
      }

      var currentPhrase = {
        lyric: lyricLine,
        section: currentIntermediaryJasonSection.name,
        chords: [] as OslynChord[],
        phrase: p,
        phraseDuration: null,
        start: null
      } as OslynPhrase


      let matchArr
      let regex = new RegExp(chordRegexForTextBlock, 'g')
      let prevChordWidth = 0
      
      while ((matchArr = regex.exec(line)) !== null) {

        //console.log(`${matchArr[0].trim()} :: ${currentIntermediaryJasonSection.chords[c].chord} :: ${c}`)

        if (currentIntermediaryJasonSection.chords[c].chord === matchArr[0].trim()) {
          let currentIntermediaryJasonChord = currentIntermediaryJasonSection.chords[c] as _Chord
          
          let currentChord = {
            chord: distanceFromKey(matchArr[0].trim(), key),
            isMinor: getIsMinor(matchArr[0].trim()),
            beats: currentIntermediaryJasonChord.duration,
            meta: {
              start: currentIntermediaryJasonChord.start,
              end: currentIntermediaryJasonChord.end,
            },
            position: lyricLine === "" ? matchArr.index : matchArr.index - prevChordWidth
          } as OslynChord

          currentPhrase.chords.push(currentChord)
          prevChordWidth = matchArr[0].trim().length
          c++
          //console.log(`${matchArr[0].trim()} c: ${c} `)
        } else { 
          throw `convertOslynSongJson(): 
          nextChord missmatch :: ${currentIntermediaryJasonSection.chords[c].chord} at index ${c} vs ${matchArr[0].trim()}`
        }
      }

      oslynSongJson.song.push(currentPhrase)
    } else if (lineType === 'annotation') {
      //console.log(getSectionName(line))

      // NOTE! Some chord sheets may have 2 of the SAME sections following 1 another
      if (getSectionName(line) === currentIntermediaryJasonSection.name) { 
        console.warn(`convertOslynSongJson(): There are 2 sections of the same name - ${currentIntermediaryJasonSection.name}, this can be OK.`)
      }

      // skip the first section .. its already defined at the beginning of the function
      if (p!== 0 || (p === 0 && getSectionName(line) !== currentIntermediaryJasonSection.name)) { 
        if (p+1 < intermediary.sections.length) {
          if (getSectionName(line) === intermediary.sections[p+1].name) {
            //console.log(getSectionName(line))
            currentIntermediaryJasonSection = intermediary.sections[p+1]
            p++; c=0
          } else { throw `convertOslynSongJson(): the next section name missmatch! Raw: "${getSectionName(line)}", Intermediary Section: ${intermediary.sections[p+1].name}` }
        } else console.log("convertOslynSongJson(): This is the last section!")
      }
    }
  }
  
  return oslynSongJson
}


export const chordSheetToOslynSong = (sheet: string, key: string, simplify: boolean) => {
  if (simplify) console.log("TODO: allow chords to be expressed as original - via 'simplify' boolean.")
  let song = rawChordsheetToIntermediaryJson(sheet)
  return convertOslynSong(sheet, song, key)
}

