// Friendly dialog title per error code
export function apiErrorTitle(code: number) {
  switch (code) {
    case 400: return 'Yêu cầu không hợp lệ'
    case 401: return 'Chưa đăng nhập'
    case 403: return 'Không có quyền truy cập'
    case 404: return 'Không tìm thấy'
    default: return 'Đã xảy ra lỗi'
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
