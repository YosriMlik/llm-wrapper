// Domain models for chat
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatRequest {
  message?: string
  messages?: ChatMessage[]
  model?: string
}

export interface ChatResponse {
  response: string
  model: string
}