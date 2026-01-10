import { Elysia } from 'elysia'
import { healthController } from './controllers/health.controller'
import { aiModelsController } from './controllers/ai-models.controller'
import { chatController } from './controllers/chat.controller'

export const app = new Elysia({ prefix: '/api' })
  .onError(({ code, error, set }) => {
    // Get error message safely
    const errorMessage = error instanceof Error ? error.message : 
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