import OpenAI from 'openai'
import secret from '@/secret.json'

const SYSTEM_PROMPT = `User will be providing text that represent lyrics and chords of a song. 
The text also contain section headers (ie. Intro, Verse 1, Chorus, etc.). 
Make sure that all section headers start and end with square brackets.
Remove all comments in the text, (these may be in the form of commentary or description of musical dynamics.)
If there is an "X" at the end, remove it. If theres nothing to change, say "no change".`

/** Same ChatGPT cleanup the song editor uses. Returns the raw completion. */
export async function cleanChordSheetCompletion(csText: string) {
  const openai = new OpenAI({
    organization: secret.openai.organization,
    apiKey: secret.openai.apiKey,
  })

  return openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: csText },
    ],
  })
}

/** Matches the song editor: a short "no change" reply keeps the original text. */
export function cleanedChordSheetText(completion: { choices?: { message?: { content?: string | null } | null }[] }, original: string): string {
  const content = completion.choices?.[0]?.message?.content
  if (!content) return original
  if (content.length < 20 && content.toLowerCase().includes('no change')) return original
  return content
}
