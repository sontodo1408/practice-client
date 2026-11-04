import type { SubjectSectionData, UserSubject } from '~/types/userSubject'

// Id of the "no topic" group the backend returns for questions without a topic
const OTHER_ID = 'other'

interface SubjectDetail {
  subject: UserSubject | null
  sections: SubjectSectionData[]
  // Set when the request failed (as opposed to the slug simply not existing)
  error: string
}

// Loads a public subject with its topics and questions. Runs on the server too (useAsyncData), so crawlers get
// the content; the same key is shared by the subject page and the question page, so data is not duplicated.
export function useSubjectDetail(slug: MaybeRefOrGetter<string>) {
  const api = useUserSubjectApi()

  return useAsyncData<SubjectDetail>(
    () => `subject-detail-${toValue(slug)}`,
    async () => {
      try {
        // The subject is found by slug in the public list, then topics and questions load in parallel
        const found = (await api.listAll()).find(s => s.slug === toValue(slug))
        if (!found) return { subject: null, sections: [], error: '' }
        const [topics, grouped] = await Promise.all([api.listTopics(found.id), api.listQuestions(found.id)])

        // Questions by topic id; topics keep the backend order
        const byTopic = new Map(grouped.map(g => [g.topicId, g.questions]))
        const sections: SubjectSectionData[] = [...topics]
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map(t => ({ id: t.slug, name: t.name, description: t.description, questions: byTopic.get(t.id) ?? [] }))
        // Questions with no topic go to a last group
        const orphans = grouped.find(g => g.topicId == null)
        if (orphans?.questions.length) {
          sections.push({ id: OTHER_ID, name: 'Khác', description: null, questions: orphans.questions })
        }
        return { subject: found, sections, error: '' }
      } catch (e) {
        if (!(e instanceof ApiError)) throw e
        return { subject: null, sections: [], error: e.message }
      }
    },
    { default: () => ({ subject: null, sections: [], error: '' }), watch: [() => toValue(slug)] }
  )
}
