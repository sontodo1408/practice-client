// Friendly dialog title per error code
export function apiErrorTitle(code: number) {
  switch (code) {
    case 400: return 'Invalid request'
    case 401: return 'Unauthorized'
    case 403: return 'Access denied'
    case 404: return 'Not found'
    default: return 'Something went wrong'
  }
}

// Error thrown by useApi for every non-200 result, so callers can stop their flow with try/catch
export class ApiError extends Error {
  // Business/HTTP code from ResponseApi.code (0 when the server was unreachable)
  readonly code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}
