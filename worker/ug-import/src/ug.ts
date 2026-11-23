import { cleanChart, decodeEntities } from './chart'

export { decodeEntities }

/** Turn Ultimate Guitar's wiki markup into the plain chart the extension reads from the page. */
export function wikiToChart(content: string): string {
  let text = decodeEntities(content).replace(/\r/g, '')
  text = text.replace(/^\s*https?:\/\/\S+\s*/i, '')
  text = text.replace(/\[ch\]([\s\S]*?)\[\/ch\]/gi, '$1')
  text = text.replace(/\[\/?tab\]/gi, '\n')
  text = text.replace(/\[(verse|chorus|bridge|intro|outro|pre-chorus|prechorus|instrumental)([^\]]*)\]/gi, (_match, name: string, rest: string) => {
    const label = name.toLowerCase() === 'prechorus' ? 'Pre-Chorus' : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
    return `[${label}${rest}]`
  })
  text = text
    .split('\n')
    .map((line) => line.replace(/\u00a0/g, ' ').replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return cleanChart(text)
}

function unescapeAttr(value: string): string {
  // The attribute source keeps named characters such as &Eacute; inside the JSON.
  // A browser would decode those when it read the attribute. This regex does not.
  return decodeEntities(value)
}

export function storeJsonFromHtml(html: string): string {
  const match = html.match(/class="js-store"[^>]*data-content="([^"]*)"/)
    || html.match(/data-content="([^"]*)"[^>]*class="js-store"/)
  if (!match) return ''
  return unescapeAttr(match[1])
}

export type UgRow = {
  songName: string
  artistName: string
  type: string
  votes: number
  rating: number
  tabUrl: string
  version: number
}

export function resultsFromStore(raw: string): UgRow[] {
  if (!raw) return []
  let data: any
  try { data = JSON.parse(raw) } catch { return [] }
  const results = data?.store?.page?.data?.results
  if (!Array.isArray(results)) return []
  return results.flatMap((row: any) => {
    const tabUrl = typeof row?.tab_url === 'string' ? row.tab_url : ''
    const songName = typeof row?.song_name === 'string' ? row.song_name : ''
    if (!tabUrl || !songName) return []
    return [{
      songName,
      artistName: typeof row?.artist_name === 'string' ? row.artist_name : '',
      type: typeof row?.type === 'string' ? row.type : '',
      votes: Number(row?.votes) || 0,
      rating: Number(row?.rating) || 0,
      tabUrl,
      version: Number(row?.version) || 0,
    }]
  })
}

export function wikiFromStore(raw: string): string {
  if (!raw) return ''
  try {
    const data = JSON.parse(raw)
    const content = data?.store?.page?.data?.tab_view?.wiki_tab?.content
    return typeof content === 'string' ? content : ''
  } catch {
    return ''
  }
}
