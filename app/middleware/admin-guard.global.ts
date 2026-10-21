// Every /admin/** screen requires a signed-in admin; otherwise go to login and come back afterwards
export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return

  const authStore = useAuthStore()
  // No user in memory (first visit or reload): load it once from /me using the token cookie
  if (!authStore.isLoggedIn) {
    await useAuth().fetchMe()
  }
  if (!authStore.isAdmin) {
    return navigateTo(loginLocation(to.fullPath))
  }
})
