import { Elysia } from 'elysia'
import { healthRoutes } from './routes/health'
import { modelsRoutes } from './routes/models'
import { chatRoutes } from './routes/chat'

export const app = new Elysia({ prefix: '/api' })
  .use(healthRoutes)
  .use(modelsRoutes)
  .use(chatRoutes)