import assert from 'node:assert/strict'
import { artistsOverlap, baseSongTitle, chooseResult, songTitleKey, titleSearchValue, titleSearchValues, UgResult } from './choose'

describe('baseSongTitle', () => {
  const base = 'No Other Name'

  for (const suffix of [
    ' - Live',
    ' (Live)',
    ' [Live]',
    ' - Live at Red Rocks',
    ' - Live at the Hollywood Bowl 2019',
    ' (Live at Red Rocks)',
    ' - Remastered 2011',
    ' (Remastered 2011)',
    ' - Remastered',
    ' - Radio Edit',
    ' (Radio Edit)',
    ' - Acoustic',
    ' (Acoustic)',
    ' [Acoustic]',
    ' (feat. Gloria Kull)',
    ' (ft. Gloria Kull)',
    ' (featuring Gloria Kull)',
    ' [feat. Gloria Kull]',
    ' - Live (feat. Gloria Kull)',
    ' (feat. Gloria Kull) - Remastered 2011',
  ]) {
    it(`strips ${JSON.stringify(suffix)}`, () => {
      assert.equal(baseSongTitle(`${base}${suffix}`), base)
      assert.equal(songTitleKey(`${base}${suffix}`), 'no other name')
    })
  }

  it('keeps a title that merely contains those words', () => {
    assert.equal(baseSongTitle('Live Like We\'re Dying'), 'Live Like We\'re Dying')
    assert.equal(baseSongTitle('Alive'), 'Alive')
    assert.equal(baseSongTitle('Acoustic Soul'), 'Acoustic Soul')
    assert.equal(songTitleKey('No Other Name'), 'no other name')
  })

  it('still ignores a Ultimate Guitar version marker', () => {
    assert.equal(songTitleKey('No Other Name (ver 2)'), 'no other name')
    assert.equal(songTitleKey('No Other Name - Live (ver 3)'), 'no other name')
  })

  it('searches the base title and keeps a title that is only a suffix', () => {
    assert.equal(titleSearchValue('No Other Name - Live'), 'No Other Name')
    assert.equal(titleSearchValue(' - Live'), '- Live')
  })

  it('folds accents and Ultimate Guitar HTML entities', () => {
    const accented = 'On écrit sur les murs'
    const plain = 'On ecrit sur les murs'
    const entity = 'On &Eacute;crit Sur Les Murs'
    assert.equal(songTitleKey(accented), 'on ecrit sur les murs')
    assert.equal(songTitleKey(plain), songTitleKey(accented))
    assert.equal(songTitleKey(entity), songTitleKey(accented))
    assert.equal(titleSearchValue(accented), plain)
    assert.equal(songTitleKey('Les Champs-Élysées'), songTitleKey('Les Champs-&Eacute;lys&eacute;es'))
    assert.equal(songTitleKey('Les Champs-Elysees'), 'les champs elysees')
    assert.equal(songTitleKey('Tous les mêmes'), songTitleKey('Tous Les M&ecirc;mes'))
    assert.equal(songTitleKey('Tous les memes'), 'tous les memes')
    assert.equal(songTitleKey("J'ai demandé à la lune"), songTitleKey('Jai Demand&eacute; &Agrave; La Lune'))
    assert.equal(songTitleKey('Ça plane pour moi'), songTitleKey('&Ccedil;a Plane Pour Moi'))
    assert.equal(songTitleKey('Ca plane pour moi'), 'ca plane pour moi')
  })

  it('searches From "X" as X - Title and ignores a dropped comma', () => {
    const title = 'I Knew It, I Knew You - From "Toy Story 5"'
    assert.equal(baseSongTitle(title), 'I Knew It, I Knew You')
    assert.equal(songTitleKey(title), songTitleKey('I Knew It I Knew You'))
    assert.equal(songTitleKey('TOY STORY 5 - I KNEW IT I KNEW YOU'), 'toy story 5 i knew it i knew you')
    assert.deepEqual(titleSearchValues(title), [
      'Toy Story 5 - I Knew It, I Knew You',
      'I Knew It, I Knew You',
    ])
    assert.equal(titleSearchValue('Mon Soleil - from "Emily in Paris" Soundtrack'), 'Mon Soleil')
  })

  it('treats apostrophes as optional in search and matching', () => {
    const straight = "You're Still The One"
    const curly = "You’re Still The One"
    const missing = "Youre Still The One"
    assert.equal(songTitleKey(straight), songTitleKey(curly))
    assert.equal(songTitleKey(straight), songTitleKey(missing))
    assert.equal(songTitleKey(straight), 'youre still the one')
    assert.equal(titleSearchValue(straight), missing)
    assert.equal(titleSearchValue(curly), missing)
  })

  const soleil = 'Mon Soleil - from "Emily in Paris Season 3" Soundtrack - from "Emily in Paris" Soundtrack'

  it('strips repeated soundtrack suffixes down to the song', () => {
    assert.equal(baseSongTitle(soleil), 'Mon Soleil')
    assert.equal(titleSearchValue(soleil), 'Mon Soleil')
    assert.equal(songTitleKey(soleil), 'mon soleil')
  })

  for (const suffix of [
    ' - from "Emily in Paris" Soundtrack',
    ' (From "Emily in Paris")',
    ' - From the Netflix Series',
    ' - Original Motion Picture Soundtrack',
    ' (Original Motion Picture Soundtrack)',
    ' - 2011 Remaster',
    ' - Single Version',
    ' - Mono',
  ]) {
    it(`strips ${JSON.stringify(suffix)}`, () => {
      assert.equal(baseSongTitle(`Mon Soleil${suffix}`), 'Mon Soleil')
    })
  }
})

describe('chooseResult', () => {
  const rows: UgResult[] = [
    { songName: 'No Other Name', artistName: 'Hillsong Worship', type: 'Chords', votes: 4000, rating: 4.8, tabUrl: 'https://tabs.example/hillsong', version: 1 },
    { songName: 'No Other Name (ver 2)', artistName: 'ICF Worship', type: 'Chords', votes: 12, rating: 4, tabUrl: 'https://tabs.example/icf', version: 2 },
    { songName: 'No Other Name', artistName: 'ICF Worship', type: 'Tab', votes: 900, rating: 5, tabUrl: 'https://tabs.example/tab', version: 1 },
    { songName: 'Other Song', artistName: 'ICF Worship', type: 'Chords', votes: 50, rating: 5, tabUrl: 'https://tabs.example/other', version: 1 },
  ]

  it('matches a live Spotify title to the base title and prefers the credited artist', () => {
    const chosen = chooseResult(rows, 'No Other Name - Live', 'ICF Worship, Gloria Kull')
    assert.equal(chosen?.tabUrl, 'https://tabs.example/icf')
    assert.equal(chosen?.fallback, false)
  })

  it('falls back to the highest-rated Chords chart when the artist has none', () => {
    const chosen = chooseResult(rows, 'No Other Name (Live)', 'Todd Dulaney')
    assert.equal(chosen?.tabUrl, 'https://tabs.example/hillsong')
    assert.equal(chosen?.fallback, true)
  })

  it('does not treat a different song as a title match', () => {
    assert.equal(chooseResult(rows, 'Acoustic Soul', 'ICF Worship'), null)
  })

  const soleilRows: UgResult[] = [
    { songName: 'Emily In Paris - Mon Soleil', artistName: 'Misc Television', type: 'Chords', votes: 8, rating: 4.5, tabUrl: 'https://tabs.example/soleil-1', version: 1 },
    { songName: 'Emily In Paris - Mon Soleil (ver 2)', artistName: 'Misc Television', type: 'Chords', votes: 40, rating: 4.9, tabUrl: 'https://tabs.example/soleil-2', version: 2 },
    { songName: 'Emily In Paris - Mon Soleil (ver 3)', artistName: 'Misc Soundtrack', type: 'Chords', votes: 15, rating: 4.2, tabUrl: 'https://tabs.example/soleil-3', version: 3 },
    { songName: 'Emily In Paris - Mon Soleil', artistName: 'Misc Cartoons', type: 'Tab', votes: 100, rating: 5, tabUrl: 'https://tabs.example/soleil-tab', version: 1 },
  ]

  it('matches Toy Story 5 - I Knew It I Knew You and not the Taylor Swift medley', () => {
    const rows: UgResult[] = [
      { songName: 'I Knew It I Knew You - August - All Too Well', artistName: 'Taylor Swift', type: 'Chords', votes: 5000, rating: 4.9, tabUrl: 'https://tabs.example/medley', version: 1 },
      { songName: 'Toy Story 5 - I Knew It I Knew You', artistName: 'Misc Cartoons', type: 'Chords', votes: 276, rating: 4.7, tabUrl: 'https://tabs.ultimate-guitar.com/tab/misc-cartoons/toy-story-5-i-knew-it-i-knew-you-chords-6471680', version: 1 },
      { songName: 'Toy Story 5 - I Knew It I Knew You', artistName: 'Misc Cartoons /Taylor Swift', type: 'Chords', votes: 1, rating: 4, tabUrl: 'https://tabs.example/slash', version: 3 },
    ]
    const chosen = chooseResult(rows, 'I Knew It, I Knew You - From "Toy Story 5"', 'Taylor Swift')
    assert.equal(chosen?.tabUrl, 'https://tabs.ultimate-guitar.com/tab/misc-cartoons/toy-story-5-i-knew-it-i-knew-you-chords-6471680')
    assert.equal(chosen?.fallback, false)
    assert.equal(artistsOverlap('Taylor Swift', 'Misc Cartoons /Taylor Swift'), true)
  })

  it('matches a soundtrack title inside a longer UG title when nothing is exact', () => {
    const spotify = 'Mon Soleil - from "Emily in Paris Season 3" Soundtrack - from "Emily in Paris" Soundtrack'
    const chosen = chooseResult(soleilRows, spotify, 'Ashley Park')
    assert.equal(chosen?.tabUrl, 'https://tabs.example/soleil-2')
    assert.equal(chosen?.fallback, false)
  })

  it('keeps an exact artist match ahead of a longer soundtrack title', () => {
    const withExact: UgResult[] = [
      ...soleilRows,
      { songName: 'Mon Soleil', artistName: 'Ashley Park', type: 'Chords', votes: 1, rating: 3, tabUrl: 'https://tabs.example/ashley', version: 1 },
    ]
    const chosen = chooseResult(withExact, 'Mon Soleil', 'Ashley Park')
    assert.equal(chosen?.tabUrl, 'https://tabs.example/ashley')
    assert.equal(chosen?.fallback, false)
  })

  it('matches Kids United when Ultimate Guitar stores É as an HTML entity', () => {
    const rows: UgResult[] = [
      { songName: 'On &Eacute;crit Sur Les Murs', artistName: 'Kids United', type: 'Chords', votes: 294, rating: 4.8, tabUrl: 'https://tabs.ultimate-guitar.com/tab/1839977', version: 1 },
      { songName: 'On &Eacute;crit Sur Les Murs', artistName: 'Kids United', type: 'Chords', votes: 13, rating: 4.7, tabUrl: 'https://tabs.ultimate-guitar.com/tab/1845579', version: 2 },
      { songName: 'On &Eacute;crit Sur Les Murs', artistName: 'Demis Roussos', type: 'Chords', votes: 34, rating: 4.5, tabUrl: 'https://tabs.ultimate-guitar.com/tab/1781707', version: 1 },
    ]
    for (const title of ['On écrit sur les murs', 'On ecrit sur les murs']) {
      const chosen = chooseResult(rows, title, 'Kids United')
      assert.equal(chosen?.tabUrl, 'https://tabs.ultimate-guitar.com/tab/1839977')
      assert.equal(chosen?.fallback, false)
    }
    assert.equal(artistsOverlap('Edith Piaf', '&Eacute;dith Piaf'), true)
    assert.equal(artistsOverlap('Édith Piaf', 'Edith Piaf'), true)
  })

  it('matches Youre when Spotify spells You\'re', () => {
    const rows: UgResult[] = [
      { songName: 'Youre Still The One', artistName: 'Shania Twain', type: 'Tabs', votes: 20, rating: 4, tabUrl: 'https://tabs.example/youre-tab', version: 1 },
      { songName: 'Youre Still The One', artistName: 'Shania Twain', type: 'Chords', votes: 5568, rating: 4.8, tabUrl: 'https://tabs.example/youre-chords', version: 1 },
      { songName: 'Youre Still The One', artistName: 'Shania Twain', type: 'Chords', votes: 377, rating: 4.5, tabUrl: 'https://tabs.example/youre-v2', version: 2 },
    ]
    const chosen = chooseResult(rows, "You're Still The One", 'Shania Twain')
    assert.equal(chosen?.tabUrl, 'https://tabs.example/youre-chords')
    assert.equal(chosen?.fallback, false)
    assert.equal(chooseResult(rows, "You’re Still The One", 'Shania Twain')?.tabUrl, 'https://tabs.example/youre-chords')
  })

  it('does not let a short title take a longer unrelated song', () => {
    const home: UgResult[] = [
      { songName: 'Home', artistName: 'Edward Sharpe & The Magnetic Zeros', type: 'Chords', votes: 20, rating: 4, tabUrl: 'https://tabs.example/home', version: 1 },
      { songName: 'Take Me Home Country Roads', artistName: 'John Denver', type: 'Chords', votes: 9000, rating: 4.9, tabUrl: 'https://tabs.example/country', version: 1 },
    ]
    const chosen = chooseResult(home, 'Home', 'Edward Sharpe & The Magnetic Zeros')
    assert.equal(chosen?.tabUrl, 'https://tabs.example/home')
    assert.equal(chooseResult([home[1]], 'Home', 'Edward Sharpe & The Magnetic Zeros'), null)
  })
})
