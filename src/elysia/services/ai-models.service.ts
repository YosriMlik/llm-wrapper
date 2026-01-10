import { FREE_AI_MODELS, DEFAULT_AI_MODEL, getAiModelDisplayName } from '../config/ai-models-config'
import type { AiModel, AiModelConfig } from '../models/ai-model'

export class AiModelsService {
  static getAiModels(): AiModelConfig {
    const models: AiModel[] = FREE_AI_MODELS.map(model => ({
      id: model,
      name: getAiModelDisplayName(model),
      provider: model.split('/')[0],
      isAvailable: true,
    }))

    return {
      models,
      defaultModel: DEFAULT_AI_MODEL,
    }
  }

  static getAiModelById(id: string): AiModel | null {
    const config = this.getAiModels()
    return config.models.find(model => model.id === id) || null
  }

  static isValidModel(modelId: string): boolean {
    return FREE_AI_MODELS.includes(modelId as any)
  }
}