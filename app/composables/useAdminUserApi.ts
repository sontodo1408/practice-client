import type { AdminUser, AdminUserSearchQuery, PageResponse } from '~/types/adminUser'

// Calls for /practice/admin/user (AdminUserController)
export function useAdminUserApi() {
  const api = useApi()
  const base = '/practice/admin/user'

  return {
    // Paged search by username keyword
    search: (query: AdminUserSearchQuery) =>
      api.get<PageResponse<AdminUser>>(`${base}/search`, { query: { ...query } }),
    // The backend binds userId/beanLimit from the query string (no request body)
    updateBeanLimit: (userId: string, beanLimit: number) =>
      api.put<void>(`${base}/bean-limit`, undefined, { query: { userId, beanLimit } })
  }
}
