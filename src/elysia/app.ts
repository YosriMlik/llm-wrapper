import { Elysia } from 'elysia'
import { healthController } from './controllers/health.controller'
import { aiModelsController } from './controllers/ai-models.controller'
import { chatController } from './controllers/chat.controller'

export const app = new Elysia({ prefix: '/api' })
  .onError(({ code, error, set }) => {
    console.error('Elysia Error:', { code, error: error.message })
    
    if (code === 'NOT_FOUND') {
      set.status = 404
      return { error: 'Route not found' }
    }
    
    set.status = 500
    return { error: error.message || 'Internal server error' }
  })
  .use(healthController)
  .use(aiModelsController)
  .use(chatController)