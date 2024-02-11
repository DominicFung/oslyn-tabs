import * as ort from 'onnxruntime-web'
import { OslynSlide } from '@/core/types'

const kSampleRate = 16000;
const kSteps = kSampleRate * 30;
const kDelay = 100;
const kModel = "models/onnx/v3/whisper_cpu_int8_cpu-cpu_model.onnx"

const id = "whisper-log"
export interface Message { buffer: string, oslynSlides: OslynSlide, page: number }

// wrapper around onnxruntime and model
class Whisper {
  sess: ort.InferenceSession | null
  min_length: Int32Array
  max_length: Int32Array
  num_return_sequences: Int32Array
  length_penalty: Float32Array
  repetition_penalty: Float32Array
  attention_mask: Int32Array

  constructor(url: string, cb: any) {
    ort.env.logLevel = "error";
    this.sess = null;

    // semi constants that we initialize once and pass to every run() call
    this.min_length = Int32Array.from({ length: 1 }, () => 1);
    this.max_length = Int32Array.from({ length: 1 }, () => 448);
    this.num_return_sequences = Int32Array.from({ length: 1 }, () => 1);
    this.length_penalty = Float32Array.from({ length: 1 }, () => 1.);
    this.repetition_penalty = Float32Array.from({ length: 1 }, () => 1.);
    this.attention_mask = Int32Array.from({ length: 1 * 80 * 3000 }, () => 0);

    const opt = {
        executionProviders: ["wasm"],
        //logSeverityLevel: 0,
        //logVerbosityLevel: 0
    } as ort.InferenceSession.SessionOptions

    console.log(`${self.location.protocol}//${self.location.hostname}${self.location.port?`:${self.location.port}`:""}/${url}`)
    ort.InferenceSession.create(
      `${self.location.protocol}//${self.location.hostname}${self.location.port?`:${self.location.port}`:""}/${url}`, opt
    ).then((s) => {
        this.sess = s;
        cb();
    }, (e) => { cb(e); })
  }

    async run(audio_pcm: ort.TypedTensor<"float32">, beams = 1) {
      if (!this.sess) throw "no session available"
      // clone semi constants into feed. The clone is needed if we run with ort.env.wasm.proxy=true
      const feed = {
          "audio_pcm": audio_pcm,
          "max_length": new ort.Tensor(new Int32Array(this.max_length), [1]),
          "min_length": new ort.Tensor(new Int32Array(this.min_length), [1]),
          "num_beams": new ort.Tensor(Int32Array.from({ length: 1 }, () => beams), [1]),
          "num_return_sequences": new ort.Tensor(new Int32Array(this.num_return_sequences), [1]),
          "length_penalty": new ort.Tensor(new Float32Array(this.length_penalty), [1]),
          "repetition_penalty": new ort.Tensor(new Float32Array(this.repetition_penalty), [1]),
          //"attention_mask": new ort.Tensor(new Int32Array(this.attention_mask), [1, 80, 3000]),
      }
      console.log(this.sess)
      console.log(feed)

      console.log("transcribe started")
      const result = await this.sess.run(feed)
      console.log("transcribe ended")

      console.log(result)
      return result
  }
}

ort.env.wasm.wasmPaths = {
  'ort-wasm.wasm': '/models/onnx/dist/ort-wasm.wasm',
  'ort-wasm-simd.wasm': '/models/onnx/dist/ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm': '/models/onnx/dist/ort-wasm-threaded.wasm',
}

let sess = new Whisper(kModel, (e: any) => {
  if (e === undefined) {
    log(`${kModel} loaded, ${ort.env.wasm.numThreads} threads`)
    ready()
  } else { log(`Error: ${e}`) }
})

// helpers
const log = (i: string) => { 
  console.log(`[${performance.now().toFixed(2)}] ${i}`)
  self.dispatchEvent(new CustomEvent(id, { detail: `[${performance.now().toFixed(2)}] ${i}` }))
}
const sleep = (ms: number) => { return new Promise(resolve => setTimeout(resolve, ms)) }
const busy = () => { }
const ready = () => { }
const update_status = (d: number) => {  }

self.onmessage = async (e: MessageEvent<string>) => {
  const p = JSON.parse(e.data) as Message
  console.log(p)

  transcribeAudio(decodeFloat32Str(p.buffer), p.oslynSlides, p.page)
}

// transcribe audio
async function transcribeAudio(audioBuffer: Float32Array, slides: OslynSlide, page: number) {
  busy();
  log("start transcribe ...");

  try {
    process_audio(audioBuffer, performance.now(), 0, 0, slides, page);
  }
  catch (e) {
    log(`Error: ${e}`);
    ready();
  }
}

// process audio buffer
async function process_audio(audio: Float32Array, starttime: number, idx: number, pos: number, slides: OslynSlide, page: number): Promise<any> {
  if (!sess) { log("Error: sess is empty"); return "" }
  if (idx < audio.length) {
    // not done
    try {
      await sleep(kDelay);

      // run inference for 30 sec
      const xa = audio.slice(idx, idx + kSteps);
      const start = performance.now();
      const ret = await sess.run(new ort.Tensor(xa, [1, xa.length]));
      const diff = performance.now() - start;
      update_status(diff);

      log(`TRANSCRIBED: ${ret.str.data[0]}`)

      await sleep(kDelay);
      process_audio(audio, starttime, idx + kSteps, pos + 30, slides, page);
      return placementInSlide(ret.str.data[0] as string, slides, page) || ""
    } catch (e) {
      log(`Error: ${e}`);
      ready();
    }
  } else {
    // done with audio buffer
    const processing_time = ((performance.now() - starttime) / 1000);
    const total = (audio.length / kSampleRate);
    log(`total ${processing_time.toFixed(1)}sec for ${total.toFixed(1)}sec`);
    ready();
  }
}

/**
 * @param s1          string output by ASR to be matched with reference
 * @param reference   reference oslyn slides
 * @param pn          page number
 * 
 * given a string, s1, output by ASR (openai/Whisper).
 * find the placement
 */
function placementInSlide(s1: string, reference: OslynSlide, pn: number, cutoff=0.9) {
  let input = s1.replace(/[!"#$%&()*+,.:;<=>?@[\]^_`{|}~]/g, '').trim().toLowerCase()
  console.log(input)
  
  // start with current page
  if (reference.pages.length < pn ) { console.error("page doesnt exist in slides"); return }
  let slide = reference.pages[pn]

  let refText = ""
  for (const l of slide.lines) { refText = `${refText} ${l.lyric}` }
  refText = refText.replace(/[!"#$%&()*+,.:;<=>?@[\]^_`{|}~]/g, '').trim().toLowerCase()
    
  const ans = findApproximateSubstringLocation(input, refText)
  if ( ans.percentageMatch <= cutoff ) return { ...ans, pn }
  
  console.log(`could not find ans with large cutoff > ${cutoff}`)
  console.log(ans)
  return
}

function findApproximateSubstringLocation(x: string, y: string): { position: number; percentageMatch: number } {
  const xLength = x.length;
  const yLength = y.length;

  let maxMatch = 0;
  let bestPosition = -1;

  for (let i = 0; i <= yLength - xLength; i++) {
      const substringY = y.substring(i, i + xLength);
      let matchCount = 0;

      // Count matching characters
      for (let j = 0; j < xLength; j++) {
          if (x[j] === substringY[j]) {
              matchCount++;
          }
      }

      // Calculate percentage match
      const percentageMatch = (matchCount / xLength) * 100;

      // Update if this position has a higher match percentage
      if (percentageMatch > maxMatch) {
          maxMatch = percentageMatch;
          bestPosition = i;
      }
  }

  return {
      position: bestPosition,
      percentageMatch: maxMatch,
  };
}

function decodeFloat32Str(str: string){
  let bytes = new Uint8Array(
      str.match(/../g)!.map(x => parseInt(x, 16)));
  let decodedData = new Float32Array(bytes.buffer);
  return decodedData;
}

export {}