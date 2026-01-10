// Domain models for AI models
export interface AiModel {
  id: string
  name: string
  provider?: string
  isAvailable?: boolean
}

export interface AiModelConfig {
  models: AiModel[]
  defaultModel: string
}