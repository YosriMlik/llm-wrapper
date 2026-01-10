import { createOpenRouterService } from './openrouter'
import { DEFAULT_AI_MODEL } from '../config/ai-models-config'
import type { ChatMessage, ChatRequest, ChatResponse } from '../models/chat'

export class ChatService {
  static async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const { message, messages, model } = request

    // Validate message
    if (!message && (!messages || messages.length === 0)) {
      throw new Error('Message or messages array is required')
    }

    // Create OpenRouter service
    const openRouterService = createOpenRouterService()
    if (!openRouterService) {
      throw new Error('OpenRouter API key not configured')
    }

    // Use provided model or default
    const selectedModel = model || DEFAULT_AI_MODEL

    // Build messages array
    let chatMessages: ChatMessage[]
    if (messages && Array.isArray(messages) && messages.length > 0) {
      chatMessages = messages
    } else if (message) {
      chatMessages = [{ role: 'user', content: message }]
    } else {
      throw new Error('Message or messages array is required')
    }

    try {
      const response = await openRouterService.chat(selectedModel, chatMessages)

      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response from AI model')
      }

      return {
        response: response.choices[0].message.content,
        model: response.model || selectedModel,
      }
    } catch (error) {
      console.error('OpenRouter API error:', error)
      throw new Error(error instanceof Error ? error.message : 'Failed to get AI response')
    }
  }
}