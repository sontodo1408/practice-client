import type { Question } from '~/types/question'

// Subject as shown on the public home screen (mirrors Java HomeSubjectResponse)
export interface UserSubject {
  id: number
  name: string
  slug: string
  description: string | null
  // Banner path inside /imgs (e.g. "banner/img_db.png"); resolve with imgUrl()
  imgBanner: string | null
  // Number of topics / questions in the subject
  topicCount: number
  questionCount: number
  // Learning progress 0-100; only set for subjects the signed-in user is studying (no backend endpoint yet)
  progress?: number
}

// One topic block on the subject detail page; `id` is the topic slug and doubles as the DOM anchor id
export interface SubjectSectionData {
  id: string
  name: string
  description: string | null
  questions: Question[]
}
