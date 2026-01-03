import { Elysia, t } from 'elysia'

// Free tier models from OpenRouter
const FREE_MODELS = [
  'xiaomi/mimo-v2-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  //'openai/gpt-oss-120b:free',
  'mistralai/devstral-2512:free',
]

const DEFAULT_MODEL = 'mistralai/devstral-2512:free'

// Helper function to get display name (remove :free suffix)
function getModelDisplayName(model: string): string {
  return model.replace(':free', '')
}

interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface OpenRouterRequest {
  model: string
  messages: OpenRouterMessage[]
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string
    }
  }>
  model: string
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: OpenRouterMessage[]
): Promise<OpenRouterResponse> {
  const url = 'https://openrouter.ai/api/v1/chat/completions'
  
  const requestBody: OpenRouterRequest = {
    model,
    messages,
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
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

const app = new Elysia({ prefix: '/api' })
  .get('/', () => ({
    message: 'Chatbot API is running',
    version: '1.0.0',
  }))
  .get('/models', () => ({
    models: FREE_MODELS.map(model => ({
      id: model,
      name: getModelDisplayName(model),
    })),
    default: DEFAULT_MODEL,
  }))
  .post('/chat', async ({ body }) => {
    const { message, messages, model } = body

    // Validate message
    if (!message && (!messages || messages.length === 0)) {
      return {
        error: 'Message or messages array is required',
      }
    }

    // Get API key
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return {
        error: 'OpenRouter API key not configured',
      }
    }

    // TypeScript now knows apiKey is string
    const validApiKey: string = apiKey

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
      const response = await callOpenRouter(validApiKey, selectedModel, chatMessages)

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
  }, {
    body: t.Object({
      message: t.Optional(t.String()),
      messages: t.Optional(t.Array(t.Object({
        role: t.Union([t.Literal('user'), t.Literal('assistant'), t.Literal('system')]),
        content: t.String(),
      }))),
      model: t.Optional(t.String()),
    }),
  })

export const GET = app.fetch
export const POST = app.fetch 