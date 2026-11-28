export type AsrStatus = 'loading' | 'ready' | 'error'

const RATE = 16000
const WINDOW = RATE * 6
const HOP_MS = 1500

export function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (!(fromRate > 0) || fromRate === toRate) return input
  const ratio = fromRate / toRate
  const n = Math.floor(input.length / ratio)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const pos = i * ratio
    const left = Math.floor(pos)
    const right = Math.min(input.length - 1, left + 1)
    const mix = pos - left
    out[i] = input[left] * (1 - mix) + input[right] * mix
  }
  return out
}

/**
 * Moonshine in a worker. The model downloads the first time smarter listening
 * is turned on, and audio windows are posted only while that worker is free.
 */
export function startAsr(model: 'tiny' | 'base', onText: (text: string, endMs: number) => void, onStatus: (status: AsrStatus) => void) {
  const worker = new Worker(new URL('./asr.worker.ts', import.meta.url))
  const pending: number[] = []
  let lastPost = -HOP_MS
  let ready = false
  let stopped = false
  onStatus('loading')
  worker.onmessage = (event: MessageEvent) => {
    const data = event.data as { type?: string, status?: AsrStatus, text?: string, t?: number }
    if (data.type === 'status' && data.status) {
      ready = data.status === 'ready'
      onStatus(data.status)
    } else if (data.type === 'transcript') {
      onText(data.text || '', data.t || 0)
    }
  }
  worker.onerror = () => { if (!stopped) onStatus('error') }
  worker.postMessage({ type: 'start', model })
  return {
    push(samples: Float32Array, sampleRate: number, nowMs: number) {
      if (!ready || stopped) return
      const down = downsample(samples, sampleRate, RATE)
      for (let i = 0; i < down.length; i++) pending.push(down[i])
      if (pending.length > WINDOW) pending.splice(0, pending.length - WINDOW)
      if (nowMs - lastPost < HOP_MS || pending.length < RATE) return
      lastPost = nowMs
      const audio = new Float32Array(pending)
      worker.postMessage({ type: 'audio', samples: audio, t: nowMs }, [audio.buffer])
    },
    stop() {
      stopped = true
      worker.terminate()
    },
  }
}
