// Credentials sent to POST /identity/auth/login (mirrors Java LoginRequest)
export interface LoginPayload {
  username: string
  password: string
}

// Signed-in user info (mirrors Java UserProfile); most fields can be null when the profile service has no data
export interface AuthUser {
  userId: number
  username: string
  roleId: number
  role: string
  firstName: string | null
  lastName: string | null
  email: string | null
  phone: string | null
  // ISO date (yyyy-MM-dd)
  birthday: string | null
  gender: number | null
  avatarUrl: string | null
  address: string | null
  language: string | null
  userTimezone: string | null
}

// Login response (mirrors Java AuthResponse). The token is also set as a cookie by the backend.
export interface AuthResponse {
  user: AuthUser
  token: string
}
