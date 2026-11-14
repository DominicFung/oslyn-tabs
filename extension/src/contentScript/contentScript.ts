chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Oslyn Incoming Request")
  console.log(request)
  if (request.action === 'READ_SHEET') {
    console.log("Oslyn Extention Initiated")

    const ct = getChordSheetText(window.location.href)
    console.log(ct)

    const title = getSongTitle(window.location.href)
    const artist = getArtist(window.location.href)

    console.log("Oslyn sending to chrome ..")
    sendResponse({ chordsheet: ct, title, artist, originLink: window.location.href })
  } else sendResponse(null)
})

window.onload = () => {
  console.log("Oslyn runtime initiated")
  try {
    console.log(getChordSheetText(window.location.href))
  } catch (e) {
    console.warn("Oslyn could not read the chart on load", e)
  }
  console.log("Oslyn runtine onload")
}

function textOf(el: Element | null | undefined): string {
  return (el?.textContent || "").replace(/\u00a0/g, " ").replace(/\s+\n/g, "\n").trim()
}

function getChordSheetText(url: string) {
  if (!url.includes("ultimate-guitar.com/tab/")) return ""

  const fromCode = textOf(document.querySelector("code"))
  if (fromCode) return fromCode

  const pres = Array.from(document.querySelectorAll("pre"))
  const richest = pres.sort((a, b) => textOf(b).length - textOf(a).length)[0]
  const fromPre = textOf(richest)
  if (fromPre.length > 20) return fromPre

  const blocks = Array.from(document.querySelectorAll(
    '[class*="js-tab-content"], [class*="tab-content"], [data-name="tab-content"]'
  ))
  const richestBlock = blocks.sort((a, b) => textOf(b).length - textOf(a).length)[0]
  const fromBlock = textOf(richestBlock)
  if (fromBlock.length > 20) return fromBlock

  return ""
}

function cleanTitle(value: string) {
  return value
    .replace(/\s+(chords|tabs|tab|bass tab|ukulele chords|ukulele|bass)\s*$/i, "")
    .replace(/\s+@\s+Ultimate[- ]Guitar.*$/i, "")
    .trim()
}

function getSongTitle(url: string) {
  if (!url.includes("ultimate-guitar.com/tab/")) return ""

  const heading = textOf(document.querySelector("h1"))
  if (heading) return cleanTitle(heading)

  const og = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || ""
  if (og) return cleanTitle(og)

  return cleanTitle(document.title || "")
}

function getArtist(url: string) {
  if (!url.includes("ultimate-guitar.com/tab/")) return ""

  const heading = document.querySelector("h1")
  const sibling = textOf(heading?.nextElementSibling || null)
  if (sibling && sibling.length < 120 && !sibling.toLowerCase().includes("chord")) return sibling

  const artistLink = textOf(document.querySelector('a[href*="/artist/"], a[class*="artist"]'))
  if (artistLink && artistLink.length < 120) return artistLink

  const fromTitle = (document.title || "").match(/\bby\s+(.+?)\s+@/i)
  if (fromTitle?.[1]) return fromTitle[1].trim()

  return ""
}
