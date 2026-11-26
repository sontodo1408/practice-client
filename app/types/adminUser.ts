// One user row as returned by GET /practice/admin/user/search (mirrors Java UserSettingResponseDTO)
export interface AdminUser {
  userId: string
  username: string
  firstName: string | null
  lastName: string | null
  displayName: string | null
  email: string | null
  phone: string | null
  // ISO date (yyyy-MM-dd)
  birthday: string | null
  gender: number | null
  avatarUrl: string | null
  // Beans left for today
  remainingBean: number | null
  // Beans the user may spend per day
  dailyLimitBean: number | null
}

// Query of the user search (mirrors Java UserSettingSearchRequest); pageNum is 1-based
export interface AdminUserSearchQuery {
  keyword?: string
  pageNum: number
  pageSize: number
}

// Paged payload (mirrors Java PageResponse in the common module)
export interface PageResponse<T> {
  pageNum: number
  pageSize: number
  totalRecord: number
  totalPage: number
  content: T[]
}
