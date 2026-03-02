import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { aiModelsController } from './controllers/ai-models.controller'
import { chatController } from './controllers/chat.controller'
import { userController } from './controllers/user.controller'
import { AiModelsService } from './services/ai-models.service'
//import { AuthService } from './services/auth.service'
import { ChatService } from './services/chat.service'
import { UserService } from './services/user.service'
import { authController, OpenAPI } from './controllers/auth.controller'
import { openapi } from '@elysiajs/openapi'
import { node } from '@elysiajs/node'

// Create service instances for dependency injection
const aiModelsService = new AiModelsService()
const chatService = new ChatService()
const userService = new UserService()

export const app = new Elysia({ prefix: '/api', adapter: node() })
  // Set up dependency injection with decorators
  .decorate('services', {
    aiModels: aiModelsService,
    chat: chatService,
    user: userService
  })
  .use(cors({
    origin: ["*"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Cookie"],
    exposeHeaders: ["Set-Cookie"],
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
  .use(authController)
  .use(userController)
  .use(aiModelsController)
  .use(chatController)
  .onStart(({ routes }) => {
    console.log('Elysia routes registered:')
    routes.forEach(route => {
      console.log(`${route.method} ${route.path}`)
    })
  })
  .use(openapi({
    documentation: {
      components: await OpenAPI.components,
      paths: await OpenAPI.getPaths()
    }
  }))
