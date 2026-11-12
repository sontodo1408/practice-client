// Restores the signed-in user once per visit, before any page renders, so every screen starts with the same
// auth state. On a full page load it runs on the server (the cookie is forwarded by useApi), so the HTML and the
// pinia payload already contain the user and the client never has to call /me again.
export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  // Shared server -> client flag: set once the session check has been made (even when it found no user)
  const checked = useState('auth-restored', () => false)
  if (checked.value || authStore.isLoggedIn) return
  checked.value = true

  // Crawlers and first-time visitors send no cookie: skip the pointless /me request
  if (import.meta.server && !useRequestHeaders(['cookie']).cookie) return

  await useAuth().fetchMe()
})
