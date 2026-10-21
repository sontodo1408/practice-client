// Standard envelope returned by every backend endpoint (mirrors Java ResponseApi<T>)
export interface ResponseApi<T> {
  code: number
  msg: string | null
  payload: T
}

// Optional per-request settings for the useApi helpers
export interface ApiOptions {
  // Query string parameters
  query?: Record<string, unknown>
  // Extra request headers
  headers?: Record<string, string>
  // Skip the error dialog (the ApiError is still thrown) for screens that handle errors themselves
  silent?: boolean
  // Don't redirect to the login screen on 401/403 (for callers that probe the session themselves)
  skipAuthRedirect?: boolean
}
