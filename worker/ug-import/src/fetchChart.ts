import { chromium, Page } from 'playwright'
import { chooseResult, UgResult } from './choose'
import { resultsFromStore, storeJsonFromHtml, wikiFromStore, wikiToChart } from './ug'

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const PAUSE_MS = 2000

function searchUrl(title: string, artist: string) {
  const value = encodeURIComponent(`${title} ${artist}`.trim())
  return `https://www.ultimate-guitar.com/search.php?search_type=title&value=${value}`
}

async function storeRaw(page: Page): Promise<string> {
  const raw = await page.locator('.js-store').first().getAttribute('data-content')
  return raw || ''
}

async function readStore(page: Page, url: string) {
  // React removes .js-store after hydration, so read the document response,
  // which still embeds the js-store data-content JSON.
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await page.waitForTimeout(PAUSE_MS)
  const html = response ? await response.text().catch(() => '') : ''
  const embedded = storeJsonFromHtml(html)
  if (embedded) return embedded
  return storeRaw(page).catch(() => '')
}

/** Same fallbacks as the extension content script, used when the wiki text is missing. */
async function extensionChart(page: Page): Promise<string> {
  return page.evaluate(() => {
    const textOf = (el: Element | null | undefined) => (el?.textContent || '').replace(/\u00a0/g, ' ').trim()
    const fromCode = textOf(document.querySelector('code'))
    if (fromCode) return fromCode
    const pres = Array.from(document.querySelectorAll('pre'))
    const richest = pres.sort((a, b) => textOf(b).length - textOf(a).length)[0]
    const fromPre = textOf(richest)
    if (fromPre.length > 20) return fromPre
    return ''
  })
}

export type ImportPick = {
  url: string
  votes: number
  rating: number
  version: number
  chart: string
}

export async function importChords(title: string, artist: string): Promise<ImportPick> {
  const browser = await chromium.launch({ headless: true })
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'en-US' })
    const page = await context.newPage()
    const searchStore = await readStore(page, searchUrl(title, artist))
    const results = resultsFromStore(searchStore) as UgResult[]
    const chosen = chooseResult(results, title, artist)
    if (!chosen) throw new Error(`no Chords result matched ${title} by ${artist}`)
    const tabStore = await readStore(page, chosen.tabUrl)
    const wiki = wikiToChart(wikiFromStore(tabStore))
    const chart = wiki.length > 40 ? wiki : await extensionChart(page)
    if (chart.trim().length < 20) throw new Error(`chord chart was empty at ${chosen.tabUrl}`)
    return { url: chosen.tabUrl, votes: chosen.votes, rating: chosen.rating, version: chosen.version, chart }
  } finally {
    await browser.close()
  }
}
