import type { Topic, TopicPayload } from '~/types/topic'

// CRUD calls for /practice/admin/topic (AdminTopicController). Success toasts come from useApi.
export function useTopicApi() {
  const api = useApi()
  const base = '/practice/admin/topic'

  return {
    // Without subjectId the backend returns the topics of every subject
    list: (subjectId?: number) => api.get<Topic[]>(base, { query: subjectId ? { subjectId } : undefined }),
    create: (payload: TopicPayload) => api.post<Topic>(base, payload),
    update: (id: number, payload: TopicPayload) => api.put<Topic>(`${base}/${id}`, payload),
    // Set display order of a subject's topics to the position of each id in topicIds (1..n)
    reorder: (subjectId: number, topicIds: number[]) => api.patch<void>(`${base}/reorder`, { subjectId, topicIds }),
    remove: (id: number) => api.delete<void>(`${base}/${id}`)
  }
}
