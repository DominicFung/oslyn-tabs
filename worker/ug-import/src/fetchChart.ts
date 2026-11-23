import { chromium, Page } from 'playwright'
import { chromiumLaunchOptions } from './browser'
import { chooseResult, coversQuotedWork, primaryArtist, quotedWorks, soundtrackSearchValues, titleSearchValues, UgResult, ChosenResult } from './choose'
import { withTimeout } from './timeout'
import { resultsFromStore, storeJsonFromHtml, wikiFromStore, wikiToChart } from './ug'

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const PAUSE_MS = 2000
const NAV_TIMEOUT_MS = 30_000

const TOO_MANY_RESULTS = 10

function preferPick(next: ChosenResult, prev: ChosenResult, title: string): boolean {
  const nextWork = coversQuotedWork(next.songName, title)
  const prevWork = coversQuotedWork(prev.songName, title)
  if (nextWork !== prevWork) return nextWork
  if (next.fallback !== prev.fallback) return !next.fallback
  return next.votes > prev.votes
}

function searchUrl(value: string) {
  return `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(value)}`
}

async function storeRaw(page: Page): Promise<string> {
  const raw = await page.locator('.js-store').first().getAttribute('data-content')
  return raw || ''
}

async function readStore(page: Page, url: string) {
  // React removes .js-store after hydration, so read the document response,
  // which still embeds the js-store data-content JSON.
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT_MS })
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
  fallback: boolean
  artistName: string
}

export async function importChords(title: string, artist: string): Promise<ImportPick> {
  const browser = await withTimeout(chromium.launch(chromiumLaunchOptions), NAV_TIMEOUT_MS, 'playwright launch')
  try {
    const context = await browser.newContext({ userAgent: USER_AGENT, locale: 'en-US' })
    const page = await context.newPage()
    page.setDefaultTimeout(NAV_TIMEOUT_MS)
    page.setDefaultNavigationTimeout(NAV_TIMEOUT_MS)
    const primary = primaryArtist(artist)
    let chosen: ChosenResult | null = null
    const consider = async (queryTitle: string) => {
      let rows = resultsFromStore(await readStore(page, searchUrl(queryTitle))) as UgResult[]
      let pick = chooseResult(rows, title, artist)
      const keepWork = pick && coversQuotedWork(pick.songName, title) && !pick.fallback
      if (primary && !keepWork && (rows.length >= TOO_MANY_RESULTS || !pick || pick.fallback)) {
        const narrowed = resultsFromStore(await readStore(page, searchUrl(`${queryTitle} ${primary}`))) as UgResult[]
        const second = narrowed.length ? chooseResult(narrowed, title, artist) : null
        if (second && (!pick || pick.fallback || !second.fallback)) {
          if (!pick || !coversQuotedWork(pick.songName, title) || coversQuotedWork(second.songName, title)) {
            pick = second
          }
        }
      }
      if (!pick) return
      if (!chosen || preferPick(pick, chosen, title)) chosen = pick
    }
    for (const queryTitle of titleSearchValues(title)) {
      await consider(queryTitle)
      if (chosen && !chosen.fallback && (quotedWorks(title).length === 0 || coversQuotedWork(chosen.songName, title))) break
    }
    if (!chosen || chosen.fallback) {
      for (const queryTitle of soundtrackSearchValues(title)) {
        await consider(queryTitle)
        if (chosen && !chosen.fallback) break
      }
    }
    if (!chosen) throw new Error(`no Chords result matched ${title} by ${artist}`)
    if (chosen.fallback) {
      console.warn(`artist fallback for "${title}" by "${artist}": ${chosen.artistName} (${chosen.votes} ratings) ${chosen.tabUrl}`)
    }
    const tabStore = await readStore(page, chosen.tabUrl)
    const wiki = wikiToChart(wikiFromStore(tabStore))
    const chart = wiki.length > 40 ? wiki : await extensionChart(page)
    if (chart.trim().length < 20) throw new Error(`chord chart was empty at ${chosen.tabUrl}`)
    return {
      url: chosen.tabUrl,
      votes: chosen.votes,
      rating: chosen.rating,
      version: chosen.version,
      chart,
      fallback: chosen.fallback,
      artistName: chosen.artistName,
    }
  } finally {
    await browser.close()
  }
}
