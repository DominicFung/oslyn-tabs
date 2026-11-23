import { _Section, _Song, _Chord, OslynPhrase, OslynSong, OslynChord, OslynSlide } from './types'

const CHORD_BODY = "(?:[A-G](?:#|b|♯|♭)?(?:maj|min|dim|aug|sus|add|m|M|\\+|ø|°)?(?:6\\/9|\\d+)?(?:(?:(?:add|sus|maj|min|dim|aug|m|M)?(?:#|b|♯|♭)?\\d+|\\((?:#|b|♯|♭)?\\d+\\)|6\\/9))*(?:\\/[A-G](?:#|b|♯|♭)?)?)"
export const chordRegexForTextBlock = `(^| |\\n)(${CHORD_BODY})(\\n| |$)`
export const chordRegex = `^(${CHORD_BODY})$`
export const keyRegex = "^[A-Ga-g](##?|bb?)?$"

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

const fretToken = /^(?:[xX\d]{4,6})(?:\(\d\))?$/
const isDiagramOrTab = (line: string): boolean => {
  const text = line.trim()
  if (/^[eEbBgGdDaA]\||\|[-0-9phbr/\\~xX]{4,}\|/.test(text)) return true
  if (/^\s*(?:guitar\s+\d+\s*:|.*\bplays for\b)/i.test(text)) return true
  if (/^\s*chords\s*:\s*$/i.test(text)) return true
  return text.split(/\s+/).some((token) => fretToken.test(token))
}

const isNoChordToken = (token: string): boolean => /^(?:\(N\.?C\.?\)|N\.?C\.?)$/i.test(token.trim())

const isChordLine = (line: string): boolean => {
  if (isDiagramOrTab(line)) return false
  const tokens = line.trim()
    .replace(/&ndash;|&mdash;|\u2013|\u2014/g, '-')
    .replace(/[|]/g, ' ')
    .replace(/-/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
  if (tokens.length > 0 && tokens.every(isNoChordToken)) return true
  let numOfChords = 0
  let numOfNonChords = 0

  for (let item of tokens) {
    if (isNoChordToken(item)) continue
    const cleaned = item.replace(/[^A-Za-z0-9#/()ø°+♯♭]/g, '')
    if (cleaned && new RegExp(chordRegex).test(cleaned)) {
      numOfChords = numOfChords + 1
    } else numOfNonChords = numOfNonChords + 1
  }

  //console.log(`"${line}" ${numOfChords} vs ${numOfNonChords}`)
  if (numOfChords >= numOfNonChords) return true
  else return false
}

function chordScanLine(line: string): string {
  return line
    .replace(/&ndash;/g, '       ')
    .replace(/&mdash;/g, '      ')
    .replace(/[\u2013\u2014|-]/g, ' ')
    .replace(/\(N\.?C\.?\)|N\.?C\.?/gi, (mark) => ' '.repeat(mark.length))
}

const getSectionName = (line: string): string => {
  let temp = line.split("[")
  return temp[temp.length-1].split("]")[0]
}

export const getLineType = (line: string): 'chord'|'lyric'|'annotation'|'blank' => {
  if (isDiagramOrTab(line)) return 'blank'
  if (/^\s*\([^)]*\briff\b[^)]*\)$/i.test(line.trim()) || /^\s*\(play riff[^)]*\)$/i.test(line.trim())) return 'blank'
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

   chord = chord.split(/(add|sus|maj|min|aug|dim|\/)/g)[0]
   chord = chord.split(/(M|m)/g)[0]
   chord = chord.replace(/[0-9]/g, '')
   if (new RegExp(keyRegex, 'g').test(chord)) return chord
   else { console.log(`stripChordToKey(${chord}) could not be stripped.`); return null}
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

export const getChordByNumber = (chord: number, isMinor: boolean, key: string): string|null => {
  if (!new RegExp(keyRegex, 'g').test(key)) return null
  
  for (let i=0; i<KeyDistanceMap.length; i++) {
    if (KeyDistanceMap[i].includes(key)) {
      let index = (i + chord) % KeyDistanceMap.length
      return isMinor ? KeyDistanceMap[index][0]+'m' : KeyDistanceMap[index][0]
    }
  }
  console.log("getChordByNumber(): Could not find chord given chordInt. Returning null.")
  return null
}

export const transpose = (chord: string, transpose: number): string|null => {
  if (transpose === 0) return chord
  if (!new RegExp(keyRegex, 'g').test(chord)) return null

  for (let i=0; i<KeyDistanceMap.length; i++) {
    if (KeyDistanceMap[i].includes(chord)) {
      let t = i+transpose
      while (t < 0) { t=t+KeyDistanceMap.length }
      while (t >= KeyDistanceMap.length) { t=t-KeyDistanceMap.length }
      return KeyDistanceMap[t][0]
    }
  }
  console.log(`transpose(): Could not find chord given chord ${chord}. Returning null.`)
  return null
}

const rawChordsheetToSectionJson = (text: string): _Song => {
  let sectionJson = { sections: [] } as _Song
  let index = 0
  let currentSection = { name: "", chords: [] } as _Section

  let textArray = text.split("\n")
  //console.log(text)

  for (let i=0; i<textArray.length; i++) {
    let line = textArray[i]

    let lineType = getLineType(line)
    if (lineType === 'chord') {
      //console.log(`${lineType} "${line}"`)
      let matchArr, start, end
      let regex = new RegExp(chordRegexForTextBlock, 'g')

      while ((matchArr = regex.exec(chordScanLine(line))) !== null) {
        start = index + matchArr.index
        end = start + matchArr[0].length - 2

        // chrordStrategy regex matches \n at the beginning & end of line. string.trim() cuts them out
        if (matchArr.index === 0) start = start - 1
        if (matchArr.index + matchArr[0].length === textArray[i].length) end = end + 1

        // console.log(`${currentSection.name} ${matchArr[0]}-${start}-${end} || ${matchArr.index + matchArr[0].length} : ${textArray[i].length}`)
        currentSection.chords.push({
          chord: matchArr[0].trim(),
          start, end, duration: null
        } as _Chord)
      }
    } else if (lineType === 'annotation') {
      if (currentSection.chords.length === 0 && currentSection.name === "") {
        currentSection.name = getSectionName(line)
      } else if (currentSection.chords.length === 0) {
        console.log(`We've detected an empty section: ${currentSection.name}`)
        sectionJson.sections.push(currentSection)
        currentSection = { 
          name: getSectionName(line),
          chords: []
        } as _Section
      } else {
        sectionJson.sections.push(currentSection)
        currentSection = { 
          name: getSectionName(line),
          chords: []
        } as _Section
      }
    }

    index = index + line.length + 1 // for \n ,, since that gets cut by trim(\n)
  }

  sectionJson.sections.push(currentSection)
  //console.log(JSON.stringify(sectionJson))
  return sectionJson
}

function addSpacesToEnd(str: string, x: number) {
  if (str.length >= x) {
    return str; // Return the string unchanged if it's already equal to or longer than x
  } else {
    var spacesToAdd = x - str.length;
    var spaces = ' '.repeat(spacesToAdd);
    return str + spaces;
  }
}

const getDecorator = (chord: string): string => {
  let c = chord.replace(/^[A-Ga-g](##?|bb?)?/g, "")
  if (/[mM][aA][jJ]/g.test(c)) { return c } // after removing the chord + sharps/flats, if its a "maj" modifier, we're done, return
  if(c.startsWith("m") || c.startsWith("M")) c = c.slice(1)
  return c
}

/**
 * 
 * @param text            Mono format text! We should not need to recalculate - use directly from DB
 * @param sectionJson     SectionJson from Step1
 * @param key             Key from Step0 submitted by user
 */
export const convertOslynSong = (text: string, sectionJson: _Song, key: string): OslynSong => {
  let textArray = text.split("\n")
  //let ptext = convertToProportionalFont(text)
  
  let oslynSongJson = {
    meta: {},
    song: [] as OslynPhrase[]
  } as OslynSong

  let p = 0 // currentPhraseNumber
  let currentIntermediaryJasonSection = sectionJson.sections[p] as _Section

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
      
      while ((matchArr = regex.exec(chordScanLine(line))) !== null) {
        //console.log(`${matchArr[0].trim()} :: ${currentIntermediaryJasonSection.chords[c].chord} :: ${c}`)
        if (currentIntermediaryJasonSection.chords[c].chord === matchArr[0].trim()) {
          let currentIntermediaryJasonChord = currentIntermediaryJasonSection.chords[c] as _Chord
          let decorator = getDecorator(currentIntermediaryJasonSection.chords[c].chord)
          //console.log(`${currentIntermediaryJasonSection.chords[c].chord} :: ${decorator}`)

          let currentChord = {
            chord: distanceFromKey(matchArr[0].trim(), key),
            isMinor: getIsMinor(matchArr[0].trim()),
            beats: currentIntermediaryJasonChord.duration,
            meta: {
              start: currentIntermediaryJasonChord.start,
              end: currentIntermediaryJasonChord.end,
            },
            decorator,
            position: matchArr.index
          } as OslynChord

          currentPhrase.chords.push(currentChord)
          c++
          //console.log(`${matchArr[0].trim()} c: ${c} `)
        } else { 
          throw `convertOslynSongJson(): 
          nextChord missmatch :: ${currentIntermediaryJasonSection.chords[c].chord} at index ${c} vs ${matchArr[0].trim()}`
        }
      }

      if (currentPhrase.chords[ currentPhrase.chords.length-1 ])
        currentPhrase.lyric = addSpacesToEnd(currentPhrase.lyric, currentPhrase.chords[ currentPhrase.chords.length-1 ].meta.end)
      oslynSongJson.song.push(currentPhrase)
    } else if (lineType === 'lyric' && line.trim()) {
      if (i > 0 && getLineType(textArray[i - 1]) === 'chord') {
        // The chord line above already kept this lyric.
      } else {
        oslynSongJson.song.push({
          lyric: line,
          section: currentIntermediaryJasonSection.name,
          chords: [],
          phrase: p,
          phraseDuration: null,
          start: null
        } as OslynPhrase)
      }
    } else if (lineType === 'annotation') {
      //console.log(getSectionName(line))

      // NOTE! Some chord sheets may have 2 of the SAME sections following 1 another
      if (getSectionName(line) === currentIntermediaryJasonSection.name) { 
        console.log(`convertOslynSongJson(): There are 2 sections of the same name - ${currentIntermediaryJasonSection.name}, this can be OK.`)
      }

      // skip the first section .. its already defined at the beginning of the function
      if (p!== 0 || (p === 0 && getSectionName(line) !== currentIntermediaryJasonSection.name)) { 
        if (p+1 < sectionJson.sections.length) {
          if (getSectionName(line) === sectionJson.sections[p+1].name) {
            //console.log(getSectionName(line))
            currentIntermediaryJasonSection = sectionJson.sections[p+1]
            p++; c=0
          } else { throw `convertOslynSongJson(): the next section name missmatch! Raw: "${getSectionName(line)}", Intermediary Section: ${sectionJson.sections[p+1].name}` }
        } else console.log("convertOslynSongJson(): This is the last section!")
      }
    }
  }
  
  return oslynSongJson
}

const addPhraseToSlides = (
  pages: { lines: OslynPhrase[], extra: OslynPhrase | null }[], cache: OslynPhrase[], min: number, max: number
): { lines: OslynPhrase[], extra: OslynPhrase | null }[] => {
  const r = findClosestDivisor(cache.length, min, max)
  let a = 0
  while (cache.length > 0) {
    const c = cache.shift() as OslynPhrase
    if (a%r === 0) { 
      pages.push({ lines: [c], extra: null }) 
      if (pages.length-1 > 0) pages[pages.length-2].extra = c
    }
    else { pages[pages.length-1].lines.push(c) }
    a++
  }
  return pages
}

export const convertOslynSongToPages = (s: OslynSong, min?: number, max?: number): OslynSlide => {
  let pages = [] as { lines: OslynPhrase[], extra: OslynPhrase | null }[]
  const _minLines = 2
  const _maxLines = 3
  
  /**
   * 1. Find the number of lines in each SECTION
   * 2. Break up the SECTION into equally sized lines (if possible)
   * 3. if not - last line from the previous section + (max-1 lines) from the next section.
   */

  let currentSectionName = s.song[0].section
  let currentSectionCache = [s.song[0]]

  for (let i=1; i<s.song.length; i++) {
    //console.log(`${i} ${s.song[i].lyric}`)
    if (currentSectionName != s.song[i].section) {
      currentSectionName = s.song[i].section
      pages = addPhraseToSlides(pages, currentSectionCache, min || _minLines, max || _maxLines)
    }
    currentSectionCache.push(s.song[i])
  }

  pages = addPhraseToSlides(pages, currentSectionCache, min || _minLines, max || _maxLines)
  return { pages } as OslynSlide
}

const findClosestDivisor = (x: number, min: number, max: number): number => {
  let closestDivisor: number = 1;
  let smallestRemainder = Number.MAX_SAFE_INTEGER;

  for (let divisor = max; divisor >= min; divisor--) {
    const remainder = x % divisor
    if (remainder < smallestRemainder) {
      smallestRemainder = remainder
      closestDivisor = divisor
    }
    if (smallestRemainder === 0) { break }
  }
  return closestDivisor
}

const CHART_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '...',
  ndash: '-', mdash: '-',
  lsquo: '\u2018', rsquo: '\u2019', sbquo: '\u201a',
  ldquo: '\u201c', rdquo: '\u201d', bdquo: '\u201e',
  aacute: 'á', agrave: 'à', acirc: 'â', auml: 'ä', atilde: 'ã', aring: 'å', aelig: 'æ',
  ccedil: 'ç', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  iacute: 'í', igrave: 'ì', icirc: 'î', iuml: 'ï', ntilde: 'ñ',
  oacute: 'ó', ograve: 'ò', ocirc: 'ô', ouml: 'ö', otilde: 'õ', oelig: 'œ',
  uacute: 'ú', ugrave: 'ù', ucirc: 'û', uuml: 'ü', yacute: 'ý', yuml: 'ÿ',
}

function stripSongMeta(text: string): string {
  const lines = text.split('\n')
  const header = (line: string) => /^\s*\[[^\]]+\]\s*$/.test(line.trim())
  const pureUrl = (line: string) => /^(?:https?:\/\/|www\.)\S+$/i.test(line.trim())
  const meta = /\b(?:based on|capo|tuning|tabbed by|transcribed by|version|strum(?:ming)?|bpm|tempo|difficulty|key\s*:|chords used|transpose)\b/i
  const hasHeader = lines.some(header)
  let inSong = !hasHeader
  let seenChord = false
  const kept: string[] = []
  for (const line of lines) {
    if (!inSong) {
      if (header(line)) { inSong = true; kept.push(line) }
      continue
    }
    if (header(line) || line.trim() === '') { kept.push(line); continue }
    if (pureUrl(line)) continue
    if (!seenChord && !isChordLine(line) && meta.test(line)) continue
    if (isChordLine(line)) seenChord = true
    kept.push(line)
  }
  const out: string[] = []
  let i = 0
  while (i < kept.length) {
    if (!header(kept[i])) { out.push(kept[i]); i += 1; continue }
    let j = i + 1
    while (j < kept.length && kept[j].trim() === '') j += 1
    if (j >= kept.length || header(kept[j])) { i = j; continue }
    out.push(kept[i])
    i += 1
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function decodeChartText(value: string): string {
  let text = value || ''
  for (let pass = 0; pass < 3; pass++) {
    const next = text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, body: string) => {
      if (body[0] === '#') {
        const code = body[1]?.toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
        return Number.isFinite(code) ? String.fromCodePoint(code) : entity
      }
      return CHART_ENTITIES[body] ?? CHART_ENTITIES[body.toLowerCase()] ?? entity
    })
    if (next === text) break
    text = next
  }
  return text
}

export const chordSheetToOslynSong = (sheet: string, key: string): OslynSong => {
  const text = stripSongMeta(decodeChartText(sheet))
  const song = rawChordsheetToSectionJson(text)
  //console.log(song)
  return convertOslynSong(text, song, key)
}

export const chordSheetToSlides = (sheet: string, key: string): OslynSlide => {
  const text = stripSongMeta(decodeChartText(sheet))
  const song = rawChordsheetToSectionJson(text)
  //console.log(song)
  const oslynSong = convertOslynSong(text, song, key)
  //console.log(oslynSong)
  return convertOslynSongToPages(oslynSong)
}