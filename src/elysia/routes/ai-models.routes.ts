import { Elysia, t } from 'elysia'
import { AiModelsController } from '../controllers/ai-models.controller'

// DTOs for AI Models
const AiModelDto = t.Object({
  id: t.String(),
  name: t.String(),
})

const GetAiModelsResponseDto = t.Object({
  models: t.Array(AiModelDto),
  default: t.String(),
})

export const aiModelsRoutes = new Elysia()
  .get('/ai-models', AiModelsController.getAiModels, {
    response: GetAiModelsResponseDto,
  })