import { Elysia } from 'elysia'
import { createOpenRouterService } from '@/lib/services/openrouter'
import { DEFAULT_MODEL } from '@/lib/config/models'
import { chatSchema } from '@/lib/elysia/schemas'
import type { OpenRouterMessage } from '@/lib/types/api'

export const chatRoutes = new Elysia()
  .post('/chat', async ({ body }) => {
    const { message, messages, model } = body

    // Validate message
    if (!message && (!messages || messages.length === 0)) {
      return {
        error: 'Message or messages array is required',
      }
    }

    // Create OpenRouter service
    const openRouterService = createOpenRouterService()
    if (!openRouterService) {
      return {
        error: 'OpenRouter API key not configured',
      }
    }

    // Use provided model or default to free tier model
    const selectedModel = model || DEFAULT_MODEL

    // Build messages array
    let chatMessages: OpenRouterMessage[]
    if (messages && Array.isArray(messages) && messages.length > 0) {
      // Use provided messages array (for conversation history)
      chatMessages = messages
    } else if (message) {
      // Single message - create messages array
      chatMessages = [
        {
          role: 'user' as const,
          content: message,
        },
      ]
    } else {
      return {
        error: 'Message or messages array is required',
      }
    }

    try {
      const response = await openRouterService.chat(selectedModel, chatMessages)

      if (!response.choices || response.choices.length === 0) {
        return {
          error: 'No response from AI model',
        }
      }

      return {
        response: response.choices[0].message.content,
        model: response.model || selectedModel,
      }
    } catch (error) {
      console.error('OpenRouter API error:', error)
      return {
        error: error instanceof Error ? error.message : 'Failed to get AI response',
      }
    }
  }, chatSchema)