// Supported AI providers (mirrors Java EAIType)
export type AIType = 'GEMINI' | 'CLAUDE'

// Setting as returned by the backend (mirrors Java SettingResponse)
export interface Setting {
  id: number
  aiType: AIType
  aiModel: string
  // Masked key like "abc...wxyz"; the real key is never sent back
  apiKeyMasked: string | null
  dailyBeanLimit: number
  beanPerQuestion: number
  // ISO-8601 instant
  updatedAt: string
}

// Body for update (mirrors Java SettingRequest)
export interface SettingPayload {
  // Omitted when no setting exists yet, so the backend creates it
  id?: number
  aiType: AIType
  aiModel: string
  // Empty string keeps the stored key unchanged (backend ignores blank values)
  apiKey: string
  dailyBeanLimit: number
  beanPerQuestion: number
}
