export interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  model: string
}

export interface ChatRequest {
  message?: string
  messages?: OpenRouterMessage[]
  model?: string
}

export interface ChatResponse {
  response?: string
  model?: string
  error?: string
}

export interface ModelInfo {
  id: string
  name: string
}

export interface ModelsResponse {
  models: ModelInfo[]
  default: string
}