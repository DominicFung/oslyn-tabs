
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
    sendResponse({ chordsheet: ct, title, artist })
  } else sendResponse(null)
})

window.onload = (event) => {
  console.log("Oslyn runtime initiated")

  let ct = getChordSheetText(window.location.href)
  console.log(ct)

  console.log("Oslyn runtine onload")
}

function getChordSheetText(url: string) {
  if (url.startsWith("https://tabs.ultimate-guitar.com/tab/")){
    return document.getElementsByTagName("code")[0].textContent
  }

  return ""
}

function getSongTitle(url: string) {
  if (url.startsWith("https://tabs.ultimate-guitar.com/tab/")){
    let title = document.getElementsByTagName("h1")[0].textContent
    if (title.trim().endsWith("Chords")) title = title.split("Chords")[0]
    return title
  }

  return ""
}

function getArtist(url: string) {
  if (url.startsWith("https://tabs.ultimate-guitar.com/tab/")){
    // first h1 is the title
    let titleEl = document.getElementsByTagName("h1")[0]
    let nextEl = titleEl.nextElementSibling

    return nextEl.textContent
  }

  return ""
}