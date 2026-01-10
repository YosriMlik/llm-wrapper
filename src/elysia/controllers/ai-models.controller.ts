import { Elysia, t } from 'elysia'
import { AiModelsService } from '../services/ai-models.service'

// DTOs
const AiModelDto = t.Object({
  id: t.String(),
  name: t.String(),
})

const GetAiModelsResponseDto = t.Object({
  models: t.Array(AiModelDto),
  default: t.String(),
})

// Handlers
const getAiModels = async () => {
  const config = AiModelsService.getAiModels()
  
  return {
    models: config.models.map(model => ({
      id: model.id,
      name: model.name,
    })),
    default: config.defaultModel,
  }
}

// Routes
export const aiModelsController = new Elysia()
  .get('/ai-models', getAiModels, {
    response: GetAiModelsResponseDto,
  })