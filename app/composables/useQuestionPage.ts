import type { QuestionPageData } from '~/types/question'
import type { UserSubject } from '~/types/userSubject'

interface QuestionPageState {
  subject: UserSubject | null
  page: QuestionPageData | null
  // 'notFound' for an unknown subject slug or question id, 'error' for anything else (network, server)
  failure: '' | 'notFound' | 'error'
  message: string
}

// Loads one question page from the practice-service QuestionController, plus the subject (name, banner) for
// context and SEO. Runs on the server too (useAsyncData) so crawlers receive the content.
export function useQuestionPage(slug: MaybeRefOrGetter<string>, questionId: MaybeRefOrGetter<number | null>) {
  const api = useUserSubjectApi()
  const empty = (): QuestionPageState => ({ subject: null, page: null, failure: '', message: '' })

  return useAsyncData<QuestionPageState>(
    () => `question-page-${toValue(slug)}-${toValue(questionId)}`,
    async () => {
      const id = toValue(questionId)
      if (id === null) return { ...empty(), failure: 'notFound' }
      try {
        const [subjects, page] = await Promise.all([api.listAll(), api.getQuestionPage(toValue(slug), id)])
        const subject = subjects.find(s => s.slug === toValue(slug)) ?? null
        return { ...empty(), subject, page }
      } catch (e) {
        if (!(e instanceof ApiError)) throw e
        // The backend answers 400/404 style codes when the subject or question does not exist
        return { ...empty(), failure: e.code === 400 || e.code === 404 ? 'notFound' : 'error', message: e.message }
      }
    },
    { default: empty, watch: [() => toValue(slug), () => toValue(questionId)] }
  )
}
