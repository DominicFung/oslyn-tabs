

self.onmessage = async (e: MessageEvent<string>) => {
  const p = JSON.parse(e.data)
  console.log(p)


}

export {}