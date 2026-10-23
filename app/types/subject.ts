// Subject as returned by the backend (mirrors Java SubjectResponse)
export interface Subject {
  id: number
  name: string
  slug: string
  description: string | null
  imgBanner: string | null
  // ISO-8601 instants
  createdAt: string
  updatedAt: string
}

// Body for create/update (mirrors Java SubjectRequest)
export interface SubjectPayload {
  name: string
  slug: string
  description: string
  imgBanner: string | null
}
