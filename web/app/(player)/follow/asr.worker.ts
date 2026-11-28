type AsrPipeline = (audio: Float32Array) => Promise<{ text?: string }>

type Transformers = {
  pipeline: (task: string, model: string, opts?: { device?: string, dtype?: string }) => Promise<AsrPipeline>
  env: { allowLocalModels: boolean, useBrowserCache: boolean }
}

const TINY = 'onnx-community/moonshine-tiny-ONNX'
const BASE = 'onnx-community/moonshine-base-ONNX'

let transcriber: AsrPipeline | null = null
let busy = false

async function load(model: string): Promise<AsrPipeline> {
  const mod = await import('@huggingface/transformers') as unknown as Transformers
  mod.env.allowLocalModels = false
  mod.env.useBrowserCache = true
  const id = model === 'base' ? BASE : TINY
  try {
    return await mod.pipeline('automatic-speech-recognition', id, { device: 'webgpu', dtype: 'q4' })
  } catch {
    return await mod.pipeline('automatic-speech-recognition', id, { device: 'wasm', dtype: 'q8' })
  }
}

self.onmessage = (event: MessageEvent) => {
  const data = event.data as { type?: string, model?: string, samples?: Float32Array, t?: number }
  if (data.type === 'start') {
    load(data.model || 'tiny').then((pipeline) => {
      transcriber = pipeline
      self.postMessage({ type: 'status', status: 'ready' })
    }).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'speech model failed'
      self.postMessage({ type: 'status', status: 'error', message })
    })
    return
  }
  if (data.type !== 'audio' || !transcriber || busy || !data.samples) return
  busy = true
  const end = data.t || 0
  transcriber(data.samples).then((result) => {
    busy = false
    self.postMessage({ type: 'transcript', t: end, text: result.text || '' })
  }).catch(() => {
    busy = false
    self.postMessage({ type: 'transcript', t: end, text: '' })
  })
}
