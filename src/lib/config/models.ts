// Free tier models from OpenRouter
export const FREE_MODELS = [
  'xiaomi/mimo-v2-flash:free',
  'nvidia/nemotron-3-nano-30b-a3b:free',
  //'openai/gpt-oss-120b:free',
  'mistralai/devstral-2512:free',
] as const

export const DEFAULT_MODEL = 'mistralai/devstral-2512:free'

// Helper function to get display name (remove :free suffix)
export function getModelDisplayName(model: string): string {
  return model.replace(':free', '')
}