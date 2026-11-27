declare module 'meyda' {
  type MeydaFeatures = { chroma?: number[], rms?: number }
  type MeydaModule = {
    bufferSize: number
    sampleRate: number
    extract: (features: string[], signal: Float32Array) => MeydaFeatures
  }
  const meyda: MeydaModule
  export default meyda
}
