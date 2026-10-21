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
