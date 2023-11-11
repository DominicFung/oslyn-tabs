import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage, PDFPageDrawTextOptions } from 'pdf-lib'
import { chordSheetToOslynSong, getChordByNumber } from './oslyn'
import { OslynChord, OslynPhrase, OslynSong } from './types'
import { Song } from '@/src/API'

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

export async function createSheet(s: Song, key?: string, doc?: PDFDocument): Promise<PDFDocument> {
  const pdfDoc = doc || await PDFDocument.create()

  const page = pdfDoc.addPage()
  const song = chordSheetToOslynSong(s.chordSheet || "", key || s.chordSheetKey || "C")
  console.log(song)

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
  const simp = oslynSimplifier(timesRomanFont, song, estimatedPLimit, width - (2 * paddingLeft) ).song

  let currentSection = ""
  for (let i=0; i<simp.length; i++) {
    if (currentSection !== simp[i].section) {
      currentSection = simp[i].section
      h = h - sectionPaddingTop - timesRomanItalicFont.heightAtSize(sectionFontSize)
      page.drawText(currentSection, {
        size: sectionFontSize,
        font: timesRomanItalicFont,
        x: paddingLeft,
        y: h,
        color: rgb(31/255, 41/255, 55/255)
      })
    }

    const phrase = simp[i]
    let lyric = phrase.lyric.replace(/[\u2005]/g, ' ')

    h = h - lyricPadding - timesRomanFont.heightAtSize(fontSize)
    writeChordLine(timesRomanFont, page, {
      size: fontSize,
      font: timesRomanBoldFont,
      x: paddingLeft,
      y: h,
      color: rgb(17/255, 24/255, 39/255)
    }, lyric, phrase.chords, key || s.chordSheetKey || "C")

    h = h - lyricPadding - timesRomanFont.heightAtSize(fontSize)
    page.drawText(lyric, {
      size: fontSize,
      font: timesRomanFont,
      x: paddingLeft,
      y: h,
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
function oslynSimplifier(font: PDFFont, song: OslynSong, plimit: number, xlimit: number, similarity=0.9): OslynSong {
  let s = {
    meta: song.meta,
    song: []
  } as OslynSong

  let currentSection = ""
  let sectionStart = 0
  for (let i=0; i<song.song.length; i++) {
    if (currentSection !== song.song[i].section) {
      currentSection = song.song[i].section
      const phrases = combineSections(font, song.song.slice(sectionStart, i), xlimit)
      console.log(phrases)
      s.song.push(...phrases)
      sectionStart = i
    }
  }

  console.log(s)
  return s
}

function combineSections(font: PDFFont, phrases: OslynPhrase[], xlimit: number): OslynPhrase[] {
  if (phrases.length <= 0) return []
  console.log(`combineSections ${xlimit}`)
  console.log(phrases)
  
  const space = "      "
  let ps: OslynPhrase[] = []

  console.log(ps)
  for (let phrase of phrases) {
    if (ps.length === 0) { 
      ps.push(JSON.parse(JSON.stringify(phrase))); 
      continue 
    }

    let i = ps.length - 1
    console.log(`modifying phrase: ${i}`)
    console.log(ps)

    let lyric = ps[i].lyric.trim()
    if (ps[i].chords[ps[i].chords.length - 1].position > lyric.length) {
      lyric = lyric + " ".repeat(ps[i].chords[ps[i].chords.length - 1].position - lyric.length)
    }
    let lyricSize = font.widthOfTextAtSize(lyric + space + phrase.lyric.trim(), fontSize)

    if (lyricSize > xlimit) { 
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

    console.log(ps)
  }

  return ps
}

function writeChordLine(font: PDFFont, page: PDFPage, options: PDFPageDrawTextOptions, lyric: string, chords: OslynChord[], key: string) {
  const padding = options.x || 0
  for (let c of chords) {
    const width = font.widthOfTextAtSize(lyric.substring(0, c.position), fontSize)
    const chord = getChordByNumber(c.chord, c.isMinor, key) || ""

    options.x = padding + width
    page.drawText(chord, options)
  }
}