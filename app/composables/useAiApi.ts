// Mirrors Java AiFeedbackRequest
export interface AiReviewRequest {
  subjectName: string
  subjectDescription: string
  question: string
  answer: string
}

// Mirrors Java AiVocabRequest: a keyword and the sentence the learner wrote with it
export interface AiVocabRequest {
  word: string
  example: string
}

// Mirrors Java AiReviewResponse: the AI text plus the beans left after the call
export interface AiReviewResponse {
  result: string
  remainingBean: number | null
}

// Calls for /practice/ai (AiController in practice-service)
export function useAiApi() {
  const api = useApi()
  const authStore = useAuthStore()
  // Resolved here (synchronously in setup) because composables cannot be called later from event handlers
  const route = useRoute()

  // Returns the AI text and syncs the header's bean count with the remaining beans
  async function call(url: string, payload: unknown) {
    const { result, remainingBean } = await api.post<AiReviewResponse>(url, payload)
    if (remainingBean != null) authStore.setBeans(remainingBean)
    return result
  }

  // AI costs beans, so it needs an account: guests are sent to the login page and come back here afterwards.
  // Returns true when the caller may go on.
  function ensureLoggedIn() {
    if (authStore.isLoggedIn) return true
    navigateTo(loginLocation(route.fullPath))
    return false
  }

  return {
    ensureLoggedIn,
    // GET /practice/ai/beans: remaining beans of the signed-in user (quiet: the header just hides them on failure)
    getBeans: () => api.get<number>('/practice/ai/beans', { silent: true, skipAuthRedirect: true }),
    // POST /practice/ai/review: AI feedback (plain text) on the learner's answer.
    // Errors are shown by useApi's dialog; the caller only needs to stop its loading state.
    review: (payload: AiReviewRequest) => call('/practice/ai/review', payload),
    // POST /practice/ai/review/vocab: AI feedback (Markdown text) on the sentences written with vocabulary words
    reviewVocab: (payload: AiVocabRequest[]) => call('/practice/ai/review/vocab', payload)
  }
}
