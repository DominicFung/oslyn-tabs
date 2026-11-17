const pendingKey = "pendingChordImport"

window.addEventListener("oslyn-import-chords", (event) => {
  const detail = (event as CustomEvent).detail as {
    songId?: string
    jamSessionId?: string
    title?: string
    artist?: string
    userId?: string
  } | undefined
  if (!detail?.songId || !detail.jamSessionId || !detail.title || !detail.userId) return
  chrome.storage.local.set({
    [pendingKey]: {
      songId: detail.songId,
      jamSessionId: detail.jamSessionId,
      title: detail.title,
      artist: detail.artist || "",
      userId: detail.userId,
    },
  })
})
