import type { QuestionPayload, TopicQuestion } from '~/types/question'

// Calls for /practice/admin/question (AdminQuestionController). Success toasts come from useApi.
export function useQuestionApi() {
  const api = useApi()
  const base = '/practice/admin/question'

  return {
    // Topics of a subject, each with its questions
    findBySubject: (subjectId: number) => api.get<TopicQuestion[]>(`${base}/subject/${subjectId}`),
    // NOTE: update/remove are not implemented in AdminQuestionController yet (assumed REST routes)
    update: (id: number, payload: QuestionPayload) => api.put<unknown>(`${base}/${id}`, payload),
    remove: (id: number) => api.delete<void>(`${base}/${id}`)
  }
}
