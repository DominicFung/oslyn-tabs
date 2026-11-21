import { readFileSync } from 'fs'
import { join } from 'path'
import { chooseResult, UgResult } from '../choose'
import { completionFailure, settleImport } from '../appsync'

function fixture(name: string): UgResult[] {
  return JSON.parse(readFileSync(join(__dirname, '../fixtures', name), 'utf8'))
}

const noOtherName = fixture('no-other-name.json')
const monSoleil = fixture('mon-soleil.json')
const youre = fixture('youre-still-the-one.json')
const home = fixture('home.json')

describe('import regressions', () => {
  // No Other Name - Live / ICF Worship: the Live suffix hid ICF's plain title behind higher-rated copies.
  it('picks the ICF Worship chart for No Other Name - Live', () => {
    const chosen = chooseResult(noOtherName, 'No Other Name - Live', 'ICF Worship, Gloria Kull')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/icf-worship/no-other-name-chords-6592757')
    expect(chosen?.fallback).toBe(false)
  })

  // Mon Soleil soundtrack title: UG files it as Emily In Paris - Mon Soleil by Misc Television.
  it('falls back to Misc Television for the Emily in Paris soundtrack title', () => {
    const title = 'Mon Soleil - from "Emily in Paris Season 3" Soundtrack - from "Emily in Paris" Soundtrack'
    const chosen = chooseResult(monSoleil, title, 'Ashley Park')
    expect(chosen?.tabUrl).toBe('https://tabs.ultimate-guitar.com/tab/misc-television/emily-in-paris-mon-soleil-chords-4004281')
    expect(chosen?.fallback).toBe(true)
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
