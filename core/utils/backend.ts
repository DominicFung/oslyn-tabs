
export function uint8ArrayToArrayBuffer(serializedBuffer: {[key: number]: number}): ArrayBuffer {
  const arrayBuffer = []

  for (let i = 0; i < Object.keys(serializedBuffer).length; i++) {
    arrayBuffer.push(serializedBuffer[i])
  }

  return Buffer.from(arrayBuffer);
}