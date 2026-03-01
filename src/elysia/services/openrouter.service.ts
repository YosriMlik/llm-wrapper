import type { ChatMessage } from '../models/chat'

// OpenRouter specific types
interface OpenRouterRequest {
  model: string
  messages: ChatMessage[]
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  model: string
}

export class OpenRouterService {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1/chat/completions'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async chat(model: string, messages: ChatMessage[]): Promise<OpenRouterResponse> {
    const requestBody: OpenRouterRequest = {
      model,
      messages,
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Chatbot App',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`)
    }

    return response.json()
  }
}

// Factory function to create service instance
export function createOpenRouterService(): OpenRouterService | null {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return null
  }
  return new OpenRouterService(apiKey)
}