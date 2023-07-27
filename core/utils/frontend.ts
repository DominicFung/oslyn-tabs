import { Session } from "next-auth"

export const calculateWidth = (t: string, fontSize: string = "text-lg") => {
  let text = document.createElement("span")
  document.body.appendChild(text)
  text.className = fontSize

  let a = t.replace(/ /g, "\u00A0")
  text.innerHTML = `${a}`

  text.style.height = 'auto';
  text.style.width = 'auto';
  text.style.position = 'absolute';
  text.style.whiteSpace = 'no-wrap';

  let width = text.clientWidth
  //console.log(`"${t}" -> ${width}`)
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

export const locations = (substring: string, string: string ) => {
  var a=[],i=-1;
  while((i=string.indexOf(substring,i+1)) >= 0) a.push(i);
  return a;
}

export const insert = (str: string, insert: number[], char: string): string => {
  let result = '';
  let currentIndex = 0;

  for (let i = 0; i < str.length; i++) {
    result += str[i];

    if (currentIndex < insert.length && i === insert[currentIndex]) {
      result += char;
      currentIndex++;
    }
  }
  return result;
}

export const findVowels = (str: string): number[] => {
  const vowels = ['a', 'e', 'i', 'o', 'u'];
  const positions: number[] = [];

  for (let i = 0; i < str.length; i++) {
    const char = str[i].toLowerCase();

    if (vowels.includes(char)) {
      positions.push(i);
    }
  }

  return positions;
}

export function substituteString(originalString: string, replacement: string, startIndex: number, endIndex: number): string {
  const prefix = originalString.substring(0, startIndex);
  const suffix = originalString.substring(endIndex);
  return prefix + replacement + suffix;
}

export type _Session = Session & {
  userId: string
}

export const sleep = (timeToDelay: number) => new Promise((resolve) => setTimeout(resolve, timeToDelay))

export function capitalizeFirstLetter(str: string) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string.");
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}