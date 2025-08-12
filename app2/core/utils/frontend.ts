export const locations = (substring: string, string: string ): number[] => {
  var a=[] as number[],i=-1;
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

export const sleep = (timeToDelay: number) => new Promise((resolve) => setTimeout(resolve, timeToDelay))

export function capitalizeFirstLetter(str: string) {
  if (typeof str !== "string") {
    throw new Error("Input must be a string.");
  }

  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function getTimeDifferenceFromNowToEpoch(startTimeEpoch: number): string {
  const currentTimeEpoch = Math.floor(Date.now() / 1000); // Convert current time to epoch format (in seconds)
  const timeDifferenceSeconds = currentTimeEpoch - Math.floor(startTimeEpoch / 1000);

  // Calculate time difference in seconds, minutes, hours, and days
  const seconds = timeDifferenceSeconds % 60;
  const minutes = Math.floor(timeDifferenceSeconds / 60) % 60;
  const hours = Math.floor(timeDifferenceSeconds / 3600) % 24;
  const days = Math.floor(timeDifferenceSeconds / 86400);
  const months = Math.floor(timeDifferenceSeconds / (86400 * 30))
  const years = Math.floor(timeDifferenceSeconds / 31536000)

  // Format the result string
  if (years > 0) {
    return `${years} year${years > 1 ? "s" : ""}`;
  }
  if (months > 0) {
    return `${months} month${months > 1 ? "s" : ""}`;
  }
  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  }
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
  if (seconds > 0) {
    return `${seconds} second${seconds !== 1 ? "s" : ""}`;
  }

  return "moments"
}

export function getUsernameInitials(username: string): string {
  const words = username.split(' ');
  let initials = '';

  for (const word of words) {
    if (word.length > 0) {
      initials += word[0].toUpperCase();
    }
  }

  return initials;
}

export function getArrayBufferFromObjectURL(objectURL: string): Promise<string | ArrayBuffer | null | undefined> {
  // Fetch the Blob data from the object URL.
  return fetch(objectURL)
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch Blob data from the object URL');
      }
      return response.blob();
    })
    .then(blob => {
      // Convert the Blob to ArrayBuffer.
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = event => {
          resolve(event.target?.result);
        };
        reader.onerror = error => {
          reject(error);
        };
        reader.readAsArrayBuffer(blob);
      });
    });
}
