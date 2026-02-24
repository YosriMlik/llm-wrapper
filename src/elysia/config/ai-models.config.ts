// Free tier AI models from OpenRouter
export const FREE_AI_MODELS = [
  'nvidia/nemotron-3-nano-30b-a3b:free',
  'google/gemma-3n-e2b-it:free',
  'arcee-ai/trinity-large-preview:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
] as const

export const DEFAULT_AI_MODEL = 'nvidia/nemotron-3-nano-30b-a3b:free'

// Helper function to get display name (remove :free suffix)
export function getAiModelDisplayName(model: string): string {
  return model.replace(':free', '')
}