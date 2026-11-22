import { readFileSync } from 'fs'
import { join } from 'path'
import { chooseResult, UgResult } from '../choose'
import { completionFailure, settleImport } from '../appsync'
import { resultsFromStore, storeJsonFromHtml } from '../ug'

function fixture(name: string): UgResult[] {
  return JSON.parse(readFileSync(join(__dirname, '../fixtures', name), 'utf8'))
}

const noOtherName = fixture('no-other-name.json')
const monSoleil = fixture('mon-soleil.json')
const youre = fixture('youre-still-the-one.json')
const home = fixture('home.json')
const knew = fixture('i-knew-it-i-knew-you.json')
const allTooWell = fixture('all-too-well.json')
const onEcrit = fixture('on-ecrit-sur-les-murs.json')
const champs = fixture('les-champs-elysees.json')
const memes = fixture('tous-les-memes.json')

describe('import regressions', () => {
  // No Other Name - Live / ICF Worship: the Live suffix hid ICF's plain title behind higher-rated copies.
  it('picks the ICF Worship chart for No Other Name - Live', () => {
    const chosen = chooseResult(noOtherName, 'No Other Name - Live', 'ICF Worship, Gloria Kull')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/icf-worship/no-other-name-chords-6592757')
    expect(chosen?.fallback).toBe(false)
  })

  // Mon Soleil soundtrack title: UG files it as Emily In Paris - Mon Soleil by Misc Television.
  it('accepts Misc Television when the show is in the title', () => {
    const title = 'Mon Soleil - from "Emily in Paris Season 3" Soundtrack - from "Emily in Paris" Soundtrack'
    const chosen = chooseResult(monSoleil, title, 'Ashley Park')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/misc-television/emily-in-paris-mon-soleil-chords-4004281')
    expect(chosen?.fallback).toBe(false)
  })

  // All Too Well (10 Minute Version) (Taylor's Version) (From The Vault): the re-record tags hid the 10 minute chart.
  it.each([
    "All Too Well (10 Minute Version) (Taylor's Version) (From The Vault)",
    "All Too Well (10 Minute Version) (Taylor's Version)",
    'All Too Well (10 Minute Version)',
  ])('picks the 10 minute chart for %s', (title) => {
    const chosen = chooseResult(allTooWell, title, 'Taylor Swift')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/taylor-swift/all-too-well-10-minute-version-chords-3946031')
    expect(chosen?.fallback).toBe(false)
  })

  it('falls back to All Too Well when the 10 minute chart is absent', () => {
    const without = allTooWell.filter((row) => !row.songName.includes('10 Minute'))
    const chosen = chooseResult(without, "All Too Well (10 Minute Version) (Taylor's Version) (From The Vault)", 'Taylor Swift')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/taylor-swift/all-too-well-chords-1189554')
    expect(chosen?.fallback).toBe(false)
  })

  it('keeps the short All Too Well chart ahead of the 10 minute version', () => {
    const chosen = chooseResult(allTooWell, 'All Too Well', 'Taylor Swift')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/taylor-swift/all-too-well-chords-1189554')
  })

  // I Knew It, I Knew You: UG drops the comma and files it under Toy Story 5 by Misc Cartoons.
  it.each([
    'I Knew It, I Knew You - From "Toy Story 5"',
    'I Knew It, I Knew You - From “Toy Story 5”',
  ])('picks Misc Cartoons for %s', (title) => {
    const medley = {
      songName: 'I Knew It I Knew You - August - All Too Well',
      artistName: 'Taylor Swift',
      type: 'Chords',
      votes: 5000,
      rating: 4.9,
      tabUrl: 'https://tabs.ultimate-guitar.com/tab/taylor-swift/i-knew-it-i-knew-you-august-all-too-well-chords-6580241',
      version: 1,
    }
    const chosen = chooseResult([...knew, medley], title, 'Taylor Swift')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/misc-cartoons/toy-story-5-i-knew-it-i-knew-you-chords-6471680')
    expect(chosen?.fallback).toBe(false)
  })

  // On écrit sur les murs: UG stores É as the letters &Eacute;, which became the word "eacute".
  it.each(['On écrit sur les murs', 'On ecrit sur les murs'])('picks Kids United for %s', (title) => {
    const chosen = chooseResult(onEcrit, title, 'Kids United')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/1839977')
    expect(chosen?.fallback).toBe(false)
  })

  // Les Champs-Élysées: UG stores both É and é as HTML entities, and the hyphen is not part of the word.
  it.each(['Les Champs-Élysées', 'Les Champs-Elysees'])('picks Joe Dassin for %s', (title) => {
    const chosen = chooseResult(champs, title, 'Joe Dassin')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/1077469')
    expect(chosen?.fallback).toBe(false)
  })

  // Tous les mêmes: ê is an entity, and "Tous les mômes" must stay a different song.
  it.each(['Tous les mêmes', 'Tous les memes'])('picks Stromae for %s', (title) => {
    const chosen = chooseResult(memes, title, 'Stromae')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/1493396')
    expect(chosen?.fallback).toBe(false)
    const momes = memes.filter((row) => row.songName.includes('ocirc'))
    expect(chooseResult(momes, title, 'Stromae')).toBeNull()
  })

  // You're Still The One: UG deletes the apostrophe, so You're and Youre were different strings.
  it.each(["You're Still The One", "You’re Still The One"])('picks Shania Twain for %s', (title) => {
    const chosen = chooseResult(youre, title, 'Shania Twain')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/shania-twain/youre-still-the-one-chords-1345')
    expect(chosen?.fallback).toBe(false)
  })

  // Version suffixes used to stay glued to the title and miss the base chart.
  it.each([
    ' (Live)',
    ' [Live]',
    ' - Live at Red Rocks',
    ' - Remastered 2011',
    ' - Radio Edit',
    ' - Acoustic',
    ' (feat. Gloria Kull)',
  ])('still matches No Other Name with suffix %s', (suffix) => {
    const chosen = chooseResult(noOtherName, `No Other Name${suffix}`, 'ICF Worship, Gloria Kull')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/icf-worship/no-other-name-chords-6592757')
  })

  // Home must not steal Take Me Home Country Roads, which has far more ratings.
  it('keeps Home off Take Me Home Country Roads', () => {
    const chosen = chooseResult(home, 'Home', 'Edward Sharpe and the Magnetic Zeros')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/edward-sharpe-and-the-magnetic-zeros/home-chords-923641')
    const onlyRoads = home.filter((row) => row.songName !== 'Home')
    expect(chooseResult(onlyRoads, 'Home', 'Edward Sharpe and the Magnetic Zeros')).toBeNull()
  })

  // The search page keeps &Eacute; inside the js-store attribute. A browser would decode it; the regex parser must too.
  it('decodes an accent entity in the search page before choosing a chart', () => {
    const html = '<div class="js-store" data-content="{&quot;store&quot;:{&quot;page&quot;:{&quot;data&quot;:{&quot;results&quot;:[{&quot;song_name&quot;:&quot;On &Eacute;crit Sur Les Murs&quot;,&quot;artist_name&quot;:&quot;Kids United&quot;,&quot;type&quot;:&quot;Chords&quot;,&quot;votes&quot;:294,&quot;rating&quot;:4.8,&quot;tab_url&quot;:&quot;https://tabs.ultimate-guitar.com/tab/1839977&quot;,&quot;version&quot;:1}]}}}}"></div>'
    const rows = resultsFromStore(storeJsonFromHtml(html))
    expect(rows[0]?.songName).toBe('On Écrit Sur Les Murs')
    expect(chooseResult(rows, 'On ecrit sur les murs', 'Kids United')?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/1839977')
  })

  // completeImport returned null after the song was missing from the set, and the worker still logged done.
  it('calls failImport when completeImport returns null', async () => {
    const failed: string[] = []
    await settleImport('622d0e85-9835-4e3b-bc63-852753956bf9', async () => {
      const failure = completionFailure(null)
      if (failure) throw new Error(failure)
    }, async (_id, error) => { failed.push(error) })
    expect(failed).toEqual(['completeImport returned no result'])
  })

  // A GraphQL error from completeImport was swallowed the same way.
  it('calls failImport when completeImport raises a GraphQL error', async () => {
    const failed: string[] = []
    await settleImport('338e584d-a44c-4b89-acf7-3123dba94524', async () => {
      throw new Error('song 0614cc4e-1aae-4b84-a319-b66945b38a6f is not in the jam')
    }, async (_id, error) => { failed.push(error) })
    expect(failed).toEqual(['song 0614cc4e-1aae-4b84-a319-b66945b38a6f is not in the jam'])
  })
})
