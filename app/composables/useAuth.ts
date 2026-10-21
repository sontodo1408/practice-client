import type { AuthResponse, AuthUser, LoginPayload } from '~/types/auth'

// Auth logic for the login screen and sign-out. The backend sets/clears the token cookie itself.
export function useAuth() {
  const api = useApi()
  const authStore = useAuthStore()

  // POST /identity/auth/login and keep the returned user profile in the store.
  // Errors are shown by the global dialog.
  async function login(payload: LoginPayload) {
    const { user } = await api.post<AuthResponse>('/identity/auth/login', payload)
    authStore.setUser(user)
  }

  // GET /identity/auth/me: restore the user from the token cookie (e.g. after a reload).
  // Fails quietly and never redirects: no/expired token just leaves the store empty.
  async function fetchMe() {
    try {
      authStore.setUser(await api.get<AuthUser>('/identity/auth/me', { silent: true, skipAuthRedirect: true }))
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
      authStore.clear()
    }
  }

  // DELETE /identity/auth/logout (clears the cookie), then forget the user locally
  async function logout() {
    try {
      await api.delete<void>('/identity/auth/logout')
    } finally {
      authStore.clear()
    }
  }

  return { login, fetchMe, logout }
}
