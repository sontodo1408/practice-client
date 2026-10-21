// Topic as returned by the backend (mirrors Java TopicResponse)
export interface Topic {
  id: number
  subjectId: number
  parentId: number | null
  name: string
  slug: string
  description: string | null
  displayOrder: number | null
}

// Body for create/update (mirrors Java TopicRequest)
export interface TopicPayload {
  subjectId: number
  parentId: number | null
  name: string
  slug: string
  description: string
  displayOrder: number | null
}
