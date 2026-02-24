import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { healthController } from './controllers/health.controller'
import { aiModelsController } from './controllers/ai-models.controller'
import { chatController } from './controllers/chat.controller'
import { AiModelsService } from './services/ai-models.service'
import { AuthService } from './services/auth.service'
import { ChatService } from './services/chat.service'

// Create service instances for dependency injection
const aiModelsService = new AiModelsService()
const authService = new AuthService()
const chatService = new ChatService()

export const app = new Elysia({ prefix: '/api' })
  // Set up dependency injection with decorators
  .decorate('services', {
    aiModels: aiModelsService,
    // auth: authService,
    chat: chatService
  })
  .use(cors({
    // origin: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    origin: "*", // Allow all origins temporarily
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }))
  .onError(({ code, error, set }) => {
    // Get error message safely
    const errorMessage = error instanceof Error ?
                        error.message :
                        typeof error === 'string' ? error :
                        'Unknown error'

    console.error('Elysia Error:', { code, error: errorMessage })

    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Route not found' }
    }

    set.status = 500
    return { error: errorMessage }
  })
  .use(healthController)
  .use(aiModelsController)
  .use(chatController)
