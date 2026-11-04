// Difficulty levels (mirrors Java EDifficulty)
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

// Question as returned by the backend (mirrors Java QuestionResponse)
export interface Question {
  id: number
  subjectId: number
  topicId: number
  title: string
  question: string
  answer: string
  difficulty: Difficulty
}

// Question as returned by the question page endpoint (mirrors Java QuestionDTO)
export interface QuestionDetail extends Question {
  createdAt: string | null
  updatedAt: string | null
}

// Payload of GET /practice/question/{subjectSlug}/{questionId} (mirrors Java QuestionPageResponse)
export interface QuestionPageData {
  // Subject name, used for the breadcrumb and the page title
  subjectName: string
  curQuestion: QuestionDetail
  previousQuestion: QuestionDetail | null
  nextQuestion: QuestionDetail | null
  // Following questions of the same subject (the backend returns the next 10 after the current one)
  sameSubjectQuestions: QuestionDetail[]
}

// Topic with its questions (mirrors Java TopicQuestionResponse)
export interface TopicQuestion {
  topicId: number
  topicName: string
  displayOrder: number | null
  description: string | null
  questions: Question[]
}

// Body for update (assumed shape; the backend has no update endpoint yet)
export interface QuestionPayload {
  subjectId: number
  topicId: number
  title: string
  question: string
  answer: string
  difficulty: Difficulty
}
