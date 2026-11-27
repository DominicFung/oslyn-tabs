import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { detectKey } from '../../aws/lambdas/util/detectKey.ts'
import { displayedChords, resolveImportedKeys } from './importChords.ts'

const SHEET = 'D    A    F#m    E'
const detect = (sheet: string) => detectKey(sheet)?.key || null

describe('imported chords match the key menu', () => {
  it('moves a placeholder C to the detected key and shows the written chords', () => {
    const choice = resolveImportedKeys({
      slotKey: 'C',
      previousChartKey: 'C',
      previousChart: '',
      chordSheet: SHEET,
      detect,
    })
    assert.equal(choice.chordSheetKey, 'A')
    assert.equal(choice.jamKey, 'A')
    assert.deepEqual(displayedChords(SHEET, choice.chordSheetKey, choice.jamKey), ['D', 'A', 'F#m', 'E'])
  })

  it('transposes into a key the player already chose', () => {
    const inC = resolveImportedKeys({
      slotKey: 'C',
      previousChartKey: 'C',
      previousChart: '',
      chordSheet: SHEET,
      userChoseKey: true,
      detect,
    })
    assert.equal(inC.jamKey, 'C')
    assert.equal(inC.chordSheetKey, 'A')
    assert.deepEqual(displayedChords(SHEET, inC.chordSheetKey, inC.jamKey), ['F', 'C', 'Am', 'G'])

    const inE = resolveImportedKeys({
      slotKey: 'E',
      previousChartKey: 'C',
      previousChart: '',
      chordSheet: SHEET,
      userChoseKey: true,
      detect,
    })
    assert.equal(inE.jamKey, 'E')
    assert.deepEqual(displayedChords(SHEET, inE.chordSheetKey, inE.jamKey), ['A', 'E', 'C#m', 'B'])
  })

  it('uses a refetched song key when the import event has not been deployed yet', () => {
    const choice = resolveImportedKeys({
      slotKey: 'C',
      previousChartKey: 'C',
      previousChart: '',
      chordSheet: SHEET,
      detectedKey: '',
      refetchedKey: 'A',
    })
    assert.equal(choice.chordSheetKey, 'A')
    assert.equal(choice.jamKey, 'A')
    assert.deepEqual(displayedChords(SHEET, choice.chordSheetKey, choice.jamKey), ['D', 'A', 'F#m', 'E'])
  })
})
