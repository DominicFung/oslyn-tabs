

export const calculateWidth = (t: string) => {
  let text = document.createElement("span")
  document.body.appendChild(text)
  text.className = "text-lg"
  text.innerHTML = t

  text.style.height = 'auto';
  text.style.width = 'auto';
  text.style.position = 'absolute';
  text.style.whiteSpace = 'no-wrap';

  let width = text.clientWidth
  document.body.removeChild(text)
  return width
}

const maxWidthToTailwindMap = [
  { upTo: 384, name: "max-w-sm" },
  { upTo: 448, name: "max-w-md" },
  { upTo: 512, name: "max-w-lg"},
  { upTo: 576, name: "max-w-xl" },
  { upTo: 640, name: "max-w-screen-sm" },
  { upTo: 768, name: "max-w-screen-md" },
  { upTo: 1024, name: "max-w-screen-lg" },
  { upTo: 1280, name: "max-w-screen-xl" },
  {  upTo: 1536, name: "max-w-screen-2xl" },
]

export const calcMaxWidthTailwindClass = (text: string[]): string => {
  let w = "max-w-sm"
  let cMax = 0
  for (let i = 0; i < text.length; i++) {
    let width = calculateWidth(text[i])
    if (width > cMax) { cMax = width }
  }
  console.log(cMax)

  for (let i = 0; i < maxWidthToTailwindMap.length; i++) {
    if (cMax < maxWidthToTailwindMap[i].upTo) { break }
    w = maxWidthToTailwindMap[i].name
  }
  return w
}