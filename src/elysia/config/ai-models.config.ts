// Free tier AI models from OpenRouter
export const FREE_AI_MODELS = [
  'cohere/north-mini-code:free',
<<<<<<< HEAD
  'inclusionai/ling-3.0-flash-sante:free',
  'nvidia/nemotron-3.5-lightning:free',
] as const

export const DEFAULT_AI_MODEL = 'cohere/north-mini-code:free'
=======

>>>>>>> 6bf7a3af3cd7d9098f154c35d378dc18d6b12ce5

// Helper function to get display name (remove :free suffix)
export function getAiModelDisplayName(model: string): string {
  return model.replace(':free', '')
}
