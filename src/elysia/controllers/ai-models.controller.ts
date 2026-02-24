import { Elysia } from 'elysia'
import { AiModelDto, GetAiModelsResponseDto } from '../dtos/ai-models.dto'
import { optionalAuth } from '../middleware/auth.middleware'

// Handlers - will use injected services
const getAiModels = (context: any) => {
  const { services, user } = context
  // Optional: Check if user can access AI models
  if (user && !services.auth.canAccessAiModels(user)) {
    throw new Error('Access denied to AI models')
  }

  const config = services.aiModels.getAiModels()

  return {
    models: config.models.map((model: any) => ({
      id: model.id,
      name: model.name,
    })),
    default: config.defaultModel,
  }
}

// Routes - Using optional auth macro
export const aiModelsController = new Elysia()
  .use(optionalAuth)
  .get('/ai-models', getAiModels, {
    optionalAuth: true,
    response: GetAiModelsResponseDto,
  })
