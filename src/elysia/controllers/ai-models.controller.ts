import { AiModelsService } from '../services/ai-models.service'

export class AiModelsController {
  static async getAiModels() {
    try {
      const config = AiModelsService.getAiModels()
      
      return {
        models: config.models.map(model => ({
          id: model.id,
          name: model.name,
        })),
        default: config.defaultModel,
      }
    } catch (error) {
      throw new Error('Failed to get AI models')
    }
  }
}