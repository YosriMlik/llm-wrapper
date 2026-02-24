import { t } from 'elysia'

export const AiModelDto = t.Object({
  id: t.String(),
  name: t.String(),
})

export const GetAiModelsResponseDto = t.Object({
  models: t.Array(AiModelDto),
  default: t.String(),
})
