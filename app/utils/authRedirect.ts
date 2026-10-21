// Login route that remembers where the user was, so login can send them back afterwards
export function loginLocation(returnTo: string) {
  const isLoginPage = returnTo === '/login' || returnTo.startsWith('/login?')
  return isLoginPage ? { path: '/login' } : { path: '/login', query: { redirect: returnTo } }
}

// Accept only in-app paths from ?redirect= (blocks open redirects like //evil.com or https://...)
export function safeRedirect(value: unknown, fallback = '/') {
  if (typeof value !== 'string') return fallback
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback
  return value
}
