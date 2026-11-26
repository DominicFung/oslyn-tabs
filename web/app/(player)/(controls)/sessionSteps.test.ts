import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CAPO_VALUES, SONG_KEYS, stepCapo, stepKey } from './sessionSteps.ts'

test('key steps use the dropdown spelling and wrap', () => {
  assert.equal(stepKey('C', 1), 'C#')
  assert.equal(stepKey('C', -1), 'B')
  assert.equal(stepKey('A', -1), 'Ab')
  assert.equal(stepKey('Ab', 1), 'A')
  assert.equal(stepKey('F#', 1), 'G')
  assert.equal(stepKey('Bb', -1), 'A')
  assert.deepEqual(SONG_KEYS.length, 12)
})

test('an unknown key still lands on the dropdown list', () => {
  assert.equal(stepKey('Am', 1), 'A')
  assert.equal(stepKey('Db', -1), 'Ab')
})

test('capo stays inside 0 through 11', () => {
  assert.equal(stepCapo('0', -1), '0')
  assert.equal(stepCapo('0', 1), '1')
  assert.equal(stepCapo('5', 1), '6')
  assert.equal(stepCapo('5', -1), '4')
  assert.equal(stepCapo('11', 1), '11')
  assert.equal(stepCapo('11', -1), '10')
  assert.equal(stepCapo('nope', 1), '1')
  assert.equal(stepCapo('nope', -1), '0')
  assert.deepEqual(CAPO_VALUES.at(-1), '11')
})
