// Mirrors Java AiFeedbackRequest
export interface AiReviewRequest {
  subjectName: string
  subjectDescription: string
  question: string
  answer: string
}

// Calls for /practice/ai (AiController in practice-service)
export function useAiApi() {
  const api = useApi()

  return {
    // POST /practice/ai/review: AI feedback (plain text) on the learner's answer.
    // Errors are shown by useApi's dialog; the caller only needs to stop its loading state.
    review: (payload: AiReviewRequest) => api.post<string>('/practice/ai/review', payload)
  }
}
