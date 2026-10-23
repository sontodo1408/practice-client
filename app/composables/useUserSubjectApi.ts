import type { TopicQuestion } from '~/types/question'
import type { Topic } from '~/types/topic'
import type { UserSubject } from '~/types/userSubject'

// Read-only calls for the public screens (HomeController in practice-service, all under /home and permitAll).
// Errors are silent and never redirect to login: the screens show them inline.
export function useUserSubjectApi() {
  const api = useApi()
  const options = { silent: true, skipAuthRedirect: true }

  return {
    // GET /practice/home/subject?keyword= . The backend filters by name/description; empty keyword lists all.
    listAll: (keyword = '') =>
      api.get<UserSubject[]>('/practice/home/subject', { ...options, query: { keyword } }),
    // GET /practice/home/topic/{subjectId}: topics (with slug) of a subject
    listTopics: (subjectId: number) => api.get<Topic[]>(`/practice/home/topic/${subjectId}`, options),
    // GET /practice/home/question/{subjectId}: questions grouped by topic
    listQuestions: (subjectId: number) =>
      api.get<TopicQuestion[]>(`/practice/home/question/${subjectId}`, options)
  }
}
