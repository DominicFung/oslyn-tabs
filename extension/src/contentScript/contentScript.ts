window.onload = () => {
  console.log("Oslyn Extention Initiated")


  let ct = getChordSheetText(window.location.href)
  console.log(ct)
  
  // send message
  if (chrome) {
    console.log("Oslyn sending to chrome ..")
    chrome.runtime.sendMessage({ chordsheet: ct }, () => { 
      console.log("Oslyn: msg sent.") 
    })
  }
}

function getChordSheetText(url: string) {
  if (url.startsWith("https://tabs.ultimate-guitar.com/tab/")){
    return document.getElementsByTagName("code")[0].textContent
  }

  return ""
}