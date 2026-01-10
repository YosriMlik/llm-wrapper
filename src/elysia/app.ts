import { Elysia } from 'elysia'
import { healthRoutes } from './routes/health.routes'
import { aiModelsRoutes } from './routes/ai-models.routes'
import { chatRoutes } from './routes/chat.routes'

export const app = new Elysia({ prefix: '/api' })
  .use(healthRoutes)
  .use(aiModelsRoutes)
  .use(chatRoutes)