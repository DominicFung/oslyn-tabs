import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFPageDrawTextOptions } from 'pdf-lib'
import { chordSheetToOslynSong, getChordByNumber } from './oslyn'
import { OslynChord, OslynPhrase } from './types'
import { Song } from '@/../src/API'

// lyric
const fontSize = 14
const paddingLeft = 24
const lyricPadding = 3

// title
const titleFontSize = 20
const titlePaddingTop = 20

// section
const sectionFontSize = 12
const sectionPaddingTop = 20

interface Note { note: string }

export async function createSheet(s: Song, key?: string, doc?: PDFDocument): Promise<PDFDocument> {
  const pdfDoc = doc || await PDFDocument.create()

  const page = pdfDoc.addPage()
  const song = chordSheetToOslynSong(s.chordSheet || "", s.chordSheetKey || "C")

  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  const timesRomanItalicFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic)

  const { width, height } = page.getSize()

  const title = `${s.title}${s.artist ? ` - ${s.artist}`:""}`
  const titleW = timesRomanFont.widthOfTextAtSize(title, titleFontSize)
  const titleH = timesRomanFont.heightAtSize(titleFontSize)
  const titlePaddingLeft = (width - titleW) / 2

  let h = height - titlePaddingTop - titleH
  
  page.drawText(title, {
    size: titleFontSize,
    font: timesRomanFont,
    x: titlePaddingLeft,
    y: h,
    color: rgb(3/255, 7/255, 18/255)
  })

  const estimatedPLimit = (height - titlePaddingTop) / (fontSize + lyricPadding)
  const simp = oslynSimplifier(timesRomanFont, song.song, estimatedPLimit, width - (2 * paddingLeft) )
  console.log(simp)

  // dw is the longest line in a section or note accumulated. 
  // We accumulate UNITL we MIGHT exceed page width (this means we're constantly looking forward ..)
  let cs = 0; const maxWidthPerSection = {} as { [sectionId: string]: { max: number, lastline: number} }
  for (let i=0; i<simp.length; i++) {
    if ((simp[i] as OslynPhrase).section) {
      const phrase = simp[i] as OslynPhrase
      phrase.lyric = phrase.lyric.replaceAll(/\x0D/g, '')
      if (maxWidthPerSection[`${phrase.section}-${cs}`]) {
        maxWidthPerSection[`${phrase.section}-${cs}`].max = Math.max(maxWidthPerSection[`${phrase.section}-${cs}`].max, timesRomanItalicFont.widthOfTextAtSize(phrase.lyric, sectionFontSize))
        maxWidthPerSection[`${phrase.section}-${cs}`].lastline = i
      } else {
        cs = i
        maxWidthPerSection[`${phrase.section}-${cs}`] = {
          max: timesRomanItalicFont.widthOfTextAtSize(phrase.lyric.trim(), sectionFontSize) || paddingLeft * 2,
          lastline: i
        }
      }
    }
  }

  // remove empty sections

  console.warn(maxWidthPerSection)

  // if ((simp[j] as Note).note) {
  //   // if (j !== i && (simp[j-1] as OslynPhrase).section) { dw = dw + max } // only happens after OslynPhrase
  //   let note = (simp[j] as Note).note
    
  //   if (dw + timesRomanItalicFont.widthOfTextAtSize(note, sectionFontSize) > width ) { dw = paddingLeft; h = h - dh }
  //   else { dw = dw + timesRomanItalicFont.widthOfTextAtSize(note, sectionFontSize) + paddingLeft; dh = 0 }
  //   break
  // } else {
  //   const phrase = simp[j] as OslynPhrase
  //   if (cs !== phrase.section) { dw = dw + max; dh = 0; break }
    
  //   if (max < timesRomanItalicFont.widthOfTextAtSize(phrase.lyric, sectionFontSize)) max = timesRomanItalicFont.widthOfTextAtSize(phrase.lyric, sectionFontSize)
  //   if (dw + max > width ) { dw = paddingLeft; break }        
  // }

  //console.log(`dw: ${dw}, dh: ${dh}`)

  let dh = 0            // current delta height
  let dw = paddingLeft  // current delta width
  
  let dhMax = 0
  let dwMax = paddingLeft

  let currentSection = ""; cs = 0;
  for (let i=0; i<simp.length; i++) {
    // TODO: add page if hight is too long ..
    
    if ((simp[i] as Note).note) {
      let note = (simp[i] as Note).note

      console.log(`${note} ${dwMax} ${width} ${h} ${dh} -- note`)

      if ( dwMax + timesRomanItalicFont.widthOfTextAtSize(note, sectionFontSize) + 100 < width ) dw = dwMax
      else { dw = paddingLeft; dwMax = paddingLeft; h = h - dh }

      dwMax = dwMax + timesRomanItalicFont.widthOfTextAtSize(note, sectionFontSize) + 100 + paddingLeft
      dh = 0

      //if (dw + timesRomanItalicFont.widthOfTextAtSize(note, sectionFontSize) + 100 > width ) { dw = paddingLeft; h = h - dh }
      //else { dw = dw + timesRomanItalicFont.widthOfTextAtSize(note, sectionFontSize) + paddingLeft }
      
      dh = 0
      console.log(`${note} ${dw} ${dwMax} ${width} ${h} -- note`)

      //h = h - sectionPaddingTop - timesRomanItalicFont.heightAtSize(sectionFontSize) - sectionPaddingTop/2
      dhMax = Math.max(sectionPaddingTop + timesRomanItalicFont.heightAtSize(sectionFontSize) + sectionPaddingTop/2, dh)
      dh = sectionPaddingTop + timesRomanItalicFont.heightAtSize(sectionFontSize) + sectionPaddingTop/2
      
      page.drawText(note, {
        size: sectionFontSize,
        font: timesRomanItalicFont,
        x: dw,
        y: h - dh,
        color: rgb(31/255, 41/255, 55/255)
      })
      if (i < simp.length-1 && (simp[i+1] as OslynPhrase).section && (simp[i] as Note).note.indexOf((simp[i+1] as OslynPhrase).section) === -1) {
        //h = h - sectionPaddingTop/2
        dhMax = Math.max(dh + sectionPaddingTop/2, dh)
        dh = dh + sectionPaddingTop/2
      } else console.log("next section is the same .. reducing padding")
      continue
    }

    const phrase = simp[i] as OslynPhrase
    if (currentSection !== phrase.section) {
      if (maxWidthPerSection[`${phrase.section}-${i}`]) {
        
        if ( dwMax + maxWidthPerSection[`${phrase.section}-${i}`].max < width ) dw = dwMax
        else { dw = paddingLeft; h = h - dh }

        dwMax = dwMax + maxWidthPerSection[`${phrase.section}-${i}`].max + paddingLeft
        dh = 0

        console.log(`${phrase.section} ${dw} ${dwMax} ${width} ${maxWidthPerSection[`${phrase.section}-${i}`].max} ${h}`)
      } else {
        console.warn(`${phrase.section}-${i} SHOULD EXIST. This might be a bug. ${currentSection} ${phrase.section}`)
      }

      if ( i == 0 || (i>0 && (!(simp[i-1] as Note).note || ((simp[i-1] as Note).note && (simp[i-1] as Note).note.indexOf(phrase.section) === -1)))) {
        currentSection = phrase.section
        //h = h - sectionPaddingTop - timesRomanItalicFont.heightAtSize(sectionFontSize)
        dhMax = Math.max(sectionPaddingTop + timesRomanItalicFont.heightAtSize(sectionFontSize), dh)
        dh = dh + sectionPaddingTop + timesRomanItalicFont.heightAtSize(sectionFontSize)
        page.drawText(currentSection, {
          size: sectionFontSize,
          font: timesRomanItalicFont,
          x: dw,
          y: h - dh,
          color: rgb(31/255, 41/255, 55/255)
        })        
      } else { console.warn(`not printing ${(simp[i-1] as Note).note} because "${phrase.lyric}" is ${phrase.section}`) }
    }

    let lyric = phrase.lyric.replace(/[\u2005]/g, ' ')

    //h = h - lyricPadding - timesRomanFont.heightAtSize(fontSize)
    dhMax = dhMax = Math.max(lyricPadding + timesRomanFont.heightAtSize(fontSize), dh)
    dh = dh + lyricPadding + timesRomanFont.heightAtSize(fontSize)

    console.log(key)
    if (lyric.trim() != "")
      writeChordLine(timesRomanFont, page, {
        size: fontSize,
        font: timesRomanBoldFont,
        x: dw,
        y: h - dh,
        color: rgb(17/255, 24/255, 39/255)
      }, lyric, phrase.chords, key || s.chordSheetKey || "C")
    else 
      writeChordLineNoLyric(timesRomanFont, page, {
        size: fontSize,
        font: timesRomanBoldFont,
        x: dw,
        y: h - dh,
        color: rgb(17/255, 24/255, 39/255)
      }, phrase.chords, key || s.chordSheetKey || "C")

    //h = h - lyricPadding - timesRomanFont.heightAtSize(fontSize)
    dhMax = dhMax = Math.max(lyricPadding + timesRomanFont.heightAtSize(fontSize), dh)
    dh = dh + lyricPadding + timesRomanFont.heightAtSize(fontSize)

    page.drawText(lyric, {
      size: fontSize,
      font: timesRomanFont,
      x: dw,
      y: h - dh,
      color: rgb(31/255, 41/255, 55/255)
    })
  }

  return pdfDoc
}

export async function save(doc: PDFDocument): Promise<string> {
  const pdfDataUri = await doc.saveAsBase64({ dataUri: true })
  return pdfDataUri
}

/**
 * Simplifier removes phrases or combines sections based on the limits.
 * plimit is the number of phares allowed to be returned. (this maps to lines on pdf)
 * xlimit is number of characters allowed per line.
 * 
 * Algorithm: 
 * Follow Dom's experience. At the end of ever step, see if plimit is satisfied.
 *   1. Combine NON chorus / bridge / intro / outro
 *   2. Remove chorus based on similarity score (above 90%)
 *   3. Comine chorus
 *   4. Comine all others
 * 
 * @param song 
 * @param plimit
 * @param xlimit
 * @param similarity number between 0 - 1, default 0.9
 * @returns 
 */
function oslynSimplifier(font: PDFFont, song: OslynPhrase[], ylimit: number, xlimit: number, similarity=0.9): (OslynPhrase|Note)[] {
  let s =  [] as OslynPhrase[]

  let currentSection = ""
  let sectionStart = 0

  let sectionCount = 0
  let sectionSearch = {} as {[s:string]: number[]}

  for (let i=0; i<song.length; i++) {
    if (currentSection !== song[i].section) {
      currentSection = song[i].section
      const phrases = combineSections(font, song.slice(sectionStart, i), xlimit)
      s.push(...JSON.parse(JSON.stringify(phrases)))
      
      sectionStart = i
      sectionCount = sectionCount + 1

      sectionSearch[currentSection] ? sectionSearch[currentSection].push(i) : sectionSearch[currentSection] = [i]
    }
  }

  if (willFitOnPage(font, ylimit, s.length, sectionCount)) { console.log(s); return s }
  else console.log(`oslynSimplifier: PDF Chordsheet is still too long: .. ${ylimit}`)

  // based on section search, incomentally reduce line numbers until desired length is achieved.
  const dataArray = Object.keys(sectionSearch).map(key => ({ key, value: sectionSearch[key].length }));
  dataArray.sort((a, b) => b.value - a.value)

  const lyrics = song.map(s => s.lyric.trim())
  let collapsible: ({ score: number, section: string, id: number }|null)[] = Array(song.length).fill(null)

  console.log(lyrics)
  console.log(song)
  console.log(dataArray)

  let oldPositions = []
  for (let d of dataArray) {
    if (d.value <= 1) continue
    //let latest = [] as { start: number, end: number, score: number }[]
    
    //console.log(sectionSearch[d.key])
    let i = sectionSearch[d.key][0]
    
    while (song[i].section === d.key) {
      oldPositions.push(i)
      //console.log(`${i} ${song[i].section} ${d.key}`)
      //console.log(song[i].lyric.trim())
      let scores = findMatchingLines(song[i].lyric.trim(), lyrics, similarity)
      //console.log(scores)

      for (let score of scores) {
        console.log(`score position ${score.position} ${i} ${JSON.stringify(oldPositions)} ${oldPositions.includes(score.position)} ${song[i].section} ${d.key}`)
        if (oldPositions.includes(score.position) || song[i].section !== song[score.position].section) { 
          // skip first instance, keep in chordsheet. Also want to skip if later lines rematch ..
          collapsible[score.position] = null
          continue 
        } 

        if (
          score.position-1 < collapsible.length && score.position-1 >= 0 && collapsible[score.position-1] && 
          collapsible[score.position-1]?.section === d.key 
        ) {
          collapsible[score.position] = { score: score.score, section: d.key, id: collapsible[score.position-1]!.id }
        } else {
          console.log(`${score.position-1 < collapsible.length} ${score.position-1 >= 0} ${collapsible[score.position-1]} ${collapsible[score.position-1]?.section === d.key}`)
          collapsible[score.position] = { score: score.score, section: d.key, id: score.position }
        }
      }

      // latest = findContinuations(latest, scores, latest.length === 0)
      // console.log(latest)

      console.log(collapsible)
      i ++
    }

    //collapsible.push(...latest)
  }

  // Remove repeating sections
  let s2 = [] as (OslynPhrase|Note)[]
  let cs = ""; let csn = 0; let csnCount = 1
  for (let i=0; i<song.length; i++) {
    if (collapsible[i]) {
      console.log(`${i} ${JSON.stringify(collapsible[i])}`)
      if (cs !== collapsible[i]!.section && csn !== collapsible[i]!.id) {
        cs = collapsible[i]!.section; csn = collapsible[i]!.id
        s2.push({ note: `${cs}`})
      } else if ((cs === collapsible[i]!.section && csn !== collapsible[i]!.id)) {
        console.log(`removing ${JSON.stringify(s2.pop())} .. should be a note`)
        csn = collapsible[i]!.id; csnCount = csnCount + 1
        s2.push({ note: `${cs} x${csnCount}` })
      }
    } else {
      cs = ""; csn = 0; csnCount = 1
      s2.push({...song[i]})
    }
  }

  console.log(s2)

  // TODO: if a section (say bridge) is repeating itself, we can also remove repeatsOh 

  // condense lines
  let s3 = [] as (OslynPhrase|Note)[]
  currentSection = ""
  sectionStart = 0
  for (let i=0; i<s2.length; i++) {
    console.log(` === ${i} === ${song[i].section}`)
    if (((s2[i] as OslynPhrase).section && currentSection !== (s2[i] as OslynPhrase).section) || (s2[i] as Note).note) {
      currentSection = (s2[i] as OslynPhrase).section

      // potential bug, should be phrase or note  ..
      const phrases = combineSections(font, s2.slice(sectionStart, i) as OslynPhrase[], xlimit)
      s3.push(...JSON.parse(JSON.stringify(phrases)))
      sectionStart = i
    }
    if ((s2[i] as Note).note) { s3.push(s2[i]); sectionStart = i + 1 }
  }

  console.log(collapsible)
  console.log(s3)
  return s3
}

function willFitOnPage(font: PDFFont, ylimit: number, lyricCount: number, sectionCount: number): boolean {
  let yestimate = lyricCount * 2 * font.heightAtSize(fontSize) +     // chords + lyric lines
    lyricCount * lyricPadding +                        // lyric padding
    sectionCount * font.heightAtSize(sectionFontSize) +   // sections
    sectionCount * sectionPaddingTop +
    font.heightAtSize(titleFontSize) + titlePaddingTop    // title & title padding

  return yestimate <= ylimit
}

function combineSections(font: PDFFont, phrases: OslynPhrase[], xlimit: number): OslynPhrase[] {
  if (phrases.length <= 0) return []
  //console.log(`combineSections ${xlimit}`)
  //console.log(phrases)
  
  const space = "      "
  let ps: OslynPhrase[] = []

  /**
   * generally - sections bias towards a 1/2 way breakpoint.
   * We will force a breakpoint at the halfway mark. 
   * Useing "breakpoints" we can expand on this algo in the future.
   */
  const breakpoints = [Math.floor(phrases.length / 2)]

  let j = -1
  for (let phrase of phrases) {
    j = j + 1
    if (ps.length === 0) { 
      ps.push(JSON.parse(JSON.stringify(phrase))); 
      continue 
    }

    let i = ps.length - 1
    //console.log(`modifying phrase: ${i}`)
    //console.log(ps)

    let lyric = ps[i].lyric.trim()
    lyric = lyric.replaceAll(/\x0D/g, '')

    if (ps[i].chords[ps[i].chords.length - 1].position > lyric.length) {
      lyric = lyric + " ".repeat(ps[i].chords[ps[i].chords.length - 1].position - lyric.length)
    }
    let lyricSize = font.widthOfTextAtSize(lyric + space + phrase.lyric.trim(), fontSize)

    if (lyricSize > xlimit || breakpoints.includes(j)) { 
      console.log(`lyric size is greater than xlimit: ${lyricSize} > ${xlimit}`)
      ps.push(JSON.parse(JSON.stringify(phrase)))
      continue
    } else { console.log(`lyric size is smaller than xlimit: ${lyricSize} < ${xlimit}`) }
    
    // combine last ps + phrase
    ps[i].lyric = lyric + space + phrase.lyric.trim()
    
    for (let chord of phrase.chords) {
      let c = { ...chord }
      c.position = c.position + space.length + lyric.length
      c.meta = { start: c.meta.start + space.length + lyric.length, end: c.meta.end + space.length + lyric.length }
      ps[i].chords.push(c)
    }

    //console.log(ps)
  }

  return ps
}

function writeChordLine(font: PDFFont, page: PDFPage, options: PDFPageDrawTextOptions, lyric: string, chords: OslynChord[], key: string): number {
  const padding = options.x || 0
  let w = 0
  for (let c of chords) {
    const width = font.widthOfTextAtSize(lyric.substring(0, c.position), fontSize)
    const chord = getChordByNumber(c.chord, c.isMinor, key) || ""
    //console.log(`${key} ${c.chord} ${chord}`)

    options.x = padding + width
    page.drawText(chord, options)
    w = width + font.widthOfTextAtSize(chord, fontSize)
  }
  return w
}

function writeChordLineNoLyric(font: PDFFont, page: PDFPage, options: PDFPageDrawTextOptions, chords: OslynChord[], key: string): number {
  let chordline = ""
  for (let c of chords) {
    let diff = c.position - chordline.length
    chordline = chordline +" ".repeat(diff)+ (getChordByNumber(c.chord, c.isMinor, key) || "")
  }
  console.log(`ONLY CHORDS: ${chordline}`)
  page.drawText(chordline, options)

  return font.widthOfTextAtSize(chordline, fontSize)
}

function findMatchingLines(query: string, lines: string[], accuracy: number): { position: number, score: number }[] {
  const similarLines: { position: number, score: number }[] = [];

  lines.forEach((line, i) => {
      const distance = levenshteinDistance(query, line);
      const lineLength = Math.max(query.length, line.length);
      const similarity = 1 - distance / lineLength;

      if (similarity >= accuracy) {
          similarLines.push({ position: i, score: similarity });
      }
  });

  return similarLines;
}

function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
          const cost = str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1;
          matrix[i][j] = Math.min(
              matrix[i - 1][j] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j - 1] + cost
          );
      }
  }

  return matrix[len1][len2];
}