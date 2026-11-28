// Node's type stripper needs the .ts specifier. The app tsconfig does not allow it.
// @ts-expect-error TS5097
import { lineMatch, lineWords, norm, wordsMatch } from './lyricMatch.ts'

export type VoiceCommand = 'next' | 'back'

export const VOICE_COOLDOWN_MS = 2000
export const VOICE_ISOLATION_MS = 1500

const COMMANDS: { phrase: string, command: VoiceCommand }[] = [
  { phrase: 'next', command: 'next' },
  { phrase: 'next page', command: 'next' },
  { phrase: 'back', command: 'back' },
  { phrase: 'go back', command: 'back' },
  { phrase: 'previous', command: 'back' },
]

export function manualDirection(command: VoiceCommand): 'next' | 'prev' {
  return command === 'next' ? 'next' : 'prev'
}

/** The command word is already a lyric on this page or the page beside it. */
export function commandCollides(command: VoiceCommand, lyricLines: string[]): boolean {
  const keywords = command === 'next' ? ['next'] : ['back', 'previous']
  const words: string[] = []
  for (let i = 0; i < lyricLines.length; i++) {
    const line = lineWords(lyricLines[i])
    for (let j = 0; j < line.length; j++) words.push(line[j])
  }
  for (let i = 0; i < keywords.length; i++) {
    for (let j = 0; j < words.length; j++) {
      if (wordsMatch(keywords[i], words[j])) return true
    }
  }
  return false
}

function phraseMatchesLyrics(phrase: string, lyricLines: string[]): boolean {
  const words = lineWords(phrase)
  if (words.length < 3) return false
  for (let i = 0; i < lyricLines.length; i++) {
    const line = lineWords(lyricLines[i])
    if (line.length < 2) continue
    if (lineMatch(words, line).fraction >= 0.6) return true
  }
  return false
}

function knownCommand(text: string): VoiceCommand | null {
  const phrase = norm(text)
  const count = phrase ? phrase.split(' ').length : 0
  if (count < 1 || count > 2) return null
  for (let i = 0; i < COMMANDS.length; i++) {
    if (COMMANDS[i].phrase === phrase) return COMMANDS[i].command
  }
  return null
}

/**
 * A command is only the whole utterance, one or two words, with nothing else
 * recognized in the surrounding pause. A longer phrase, or one that matches a
 * lyric line, is singing.
 */
export function isolatedCommand(text: string, t: number, recent: { t: number, text: string }[], lyricLines: string[], isolationMs = VOICE_ISOLATION_MS): VoiceCommand | null {
  const known = knownCommand(text)
  if (!known) return null
  if (phraseMatchesLyrics(text, lyricLines)) return null
  if (commandCollides(known, lyricLines)) return null
  const self = norm(text)
  for (let i = 0; i < recent.length; i++) {
    const hop = recent[i]
    if (Math.abs(hop.t - t) > isolationMs) continue
    const other = norm(hop.text)
    if (!other || other === self) continue
    return null
  }
  return known
}

export function readVoiceCommand(input: {
  text: string
  t: number
  recent: { t: number, text: string }[]
  lyricLines: string[]
  lastFiredAt: number | null
  cooldownMs?: number
}): VoiceCommand | null {
  const cooldown = input.cooldownMs ?? VOICE_COOLDOWN_MS
  if (input.lastFiredAt != null && input.t - input.lastFiredAt < cooldown) return null
  return isolatedCommand(input.text, input.t, input.recent, input.lyricLines)
}
