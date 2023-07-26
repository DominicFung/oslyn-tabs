export interface GenerateAIImageRequest {
  input: ReplicateStableDiffusionInput
}

interface ReplicateStableDiffusionInput {
  prompt: string
}

export interface ReplicateStableDiffusionRequest {
  version: ModelVersion
  input: ReplicateStableDiffusionInput
}

type ModelVersion = typeof STABLEDIFF_MODEL_VERSION
export const STABLEDIFF_MODEL_VERSION = "ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4"

export interface ReplicateStableDiffusionResponse extends ReplicateBase {
  output: string[]
}

interface ReplicateBase {
  completed_at: string | null,
  created_at: string,
  error: string | null,
  hardware: "cpu" | "gpu-t4" | "gpu-a100",
  id: string,
  input: any
  logs: string,
  metrics: any,
  started_at: null,
  status: string | null,
  urls: {
    get: string     //"https://api.replicate.com/v1/predictions/jfxln7xypfd27fbzmnai3r7dmy",
    cancel: string  //"https://api.replicate.com/v1/predictions/jfxln7xypfd27fbzmnai3r7dmy/cancel"
  },
  version: string
}