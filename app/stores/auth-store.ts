import type { AuthUser } from '~/types/auth'

// Role name (without any ROLE_ prefix, case-insensitive) that may open the admin screens
const ADMIN_ROLE = 'ADMIN'

// Holds the signed-in user's info (the token itself lives in a cookie set by the backend)
export const useAuthStore = defineStore('auth', () => {
  // Current user, null when signed out or not loaded yet. After a reload it is restored via GET /auth/me
  // (see admin-guard middleware); the backend still enforces the real permission (401/403) on every request.
  const user = ref<AuthUser | null>(null)
  const isLoggedIn = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.role?.replace(/^ROLE_/i, '').toUpperCase() === ADMIN_ROLE)

  function setUser(value: AuthUser | null) {
    user.value = value
  }

  // Forget the user (e.g. on logout or 401)
  function clear() {
    user.value = null
  }

  return { user, isLoggedIn, isAdmin, setUser, clear }
})
