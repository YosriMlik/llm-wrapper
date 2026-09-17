// Free tier AI models from OpenRouter
export const FREE_AI_MODELS = [
  'cohere/north-mini-code:free',
  'nex-agi/nex-n2.5-mini:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'stealth/union-alpha',
] as const

export const DEFAULT_AI_MODEL = 'nex-agi/nex-n2.5-mini:free'

// Helper function to get display name (remove :free suffix)
export function getAiModelDisplayName(model: string): string {
  return model.replace(':free', '')
}
