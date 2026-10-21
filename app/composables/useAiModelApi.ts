import type { AIType } from '~/types/setting'

// Shape of the provider responses we read (only the fields we need)
interface GeminiModelList { models?: { name: string, supportedGenerationMethods?: string[] }[] }
interface ClaudeModelList { data?: { id: string }[] }

// Lists the models a provider offers for a given API key. The call goes straight from the browser to
// the provider because the backend has no such endpoint and never returns the stored (unmasked) key.
export function useAiModelApi() {
  async function listModels(aiType: AIType, apiKey: string): Promise<string[]> {
    if (aiType === 'GEMINI') {
      const res = await $fetch<GeminiModelList>('https://generativelanguage.googleapis.com/v1beta/models', {
        query: { key: apiKey, pageSize: 1000 }
      })
      return (res.models ?? [])
        // Keep only models usable for text generation
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        // Names come as "models/gemini-..."; the setting stores the bare id
        .map(m => m.name.replace(/^models\//, ''))
    }

    const res = await $fetch<ClaudeModelList>('https://api.anthropic.com/v1/models', {
      query: { limit: 1000 },
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        // Required by Anthropic to allow calls made from a browser (CORS)
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    })
    return (res.data ?? []).map(m => m.id)
  }

  return { listModels }
}
