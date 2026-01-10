import { Elysia } from 'elysia'
import { FREE_MODELS, DEFAULT_MODEL, getModelDisplayName } from '@/lib/config/models'

export const modelsRoutes = new Elysia()
  .get('/models', () => ({
    models: FREE_MODELS.map(model => ({
      id: model,
      name: getModelDisplayName(model),
    })),
    default: DEFAULT_MODEL,
  }))