import type { ApiOptions, ResponseApi } from '~/types/api'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

// Shared API client. Handles base URL, cookies (token lives in a cookie) and the ResponseApi envelope.
export function useApi() {
  const { public: { apiBase } } = useRuntimeConfig()
  const toast = useToast()
  const dialogStore = useDialogStore()
  const appStore = useAppStore()
  const authStore = useAuthStore()
  // currentRoute instead of useRoute(): also safe to call from route middleware
  const { currentRoute } = useRouter()
  // True while a 401/403 redirect is in flight, so parallel failing requests react only once
  const redirecting = useState('api-auth-redirecting', () => false)
  // During SSR the browser cookie must be forwarded manually
  const ssrHeaders = import.meta.server ? useRequestHeaders(['cookie']) : {}

  // 401/403: drop the stale session and go to login, remembering the current screen for after sign-in.
  // Returns 'duplicate' when another failing request already started it, and 'skipped' on the login page
  // itself (e.g. wrong password) so the normal error flow applies there.
  function redirectToLogin(): 'started' | 'duplicate' | 'skipped' {
    const route = currentRoute.value
    if (route.path === '/login') return 'skipped'
    if (redirecting.value) return 'duplicate'
    redirecting.value = true
    authStore.clear()
    navigateTo(loginLocation(route.fullPath)).finally(() => { redirecting.value = false })
    return 'started'
  }

  // Show the backend message in the error dialog (unless silenced) and abort the caller's flow
  function fail(code: number, msg: string | null | undefined, options: ApiOptions): never {
    const message = msg || 'Unexpected error, please try again.'
    const isAuthError = (code === 401 || code === 403) && !options.skipAuthRedirect
    const redirect = isAuthError ? redirectToLogin() : 'skipped'
    // Parallel requests failing together show a single dialog
    if (!options.silent && redirect !== 'duplicate') {
      dialogStore.message({ title: apiErrorTitle(code), description: message })
    }
    throw new ApiError(code, message)
  }

  // Core request: unwraps ResponseApi, returns the payload on code 200
  async function request<T>(method: Method, path: string, body?: unknown, options: ApiOptions = {}): Promise<T> {
    let res: ResponseApi<T>
    // Drives the global loading indicator (counter-based, safe for parallel requests)
    appStore.startLoading()
    try {
      res = await $fetch<ResponseApi<T>>(path, {
        baseURL: apiBase,
        method,
        body: body as Record<string, unknown> | undefined,
        query: options.query,
        headers: { ...ssrHeaders, ...options.headers },
        credentials: 'include'
      })
    } catch (e) {
      // Non-2xx HTTP responses still carry a ResponseApi body (400/401/403/404...)
      const err = e as { statusCode?: number, data?: Partial<ResponseApi<unknown>> }
      return fail(err.data?.code ?? err.statusCode ?? 0, err.data?.msg ?? 'Unable to reach the server.', options)
    } finally {
      appStore.stopLoading()
    }

    // HTTP 200 but the envelope reports an error code
    if (res.code !== 200) {
      return fail(res.code, res.msg, options)
    }

    // Success with a message: toast at the top-right corner
    if (res.msg) {
      toast.add({ title: res.msg, color: 'success', icon: 'i-lucide-check-circle' })
    }
    return res.payload
  }

  return {
    get: <T>(path: string, options?: ApiOptions) => request<T>('GET', path, undefined, options),
    post: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>('POST', path, body, options),
    put: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>('PUT', path, body, options),
    patch: <T>(path: string, body?: unknown, options?: ApiOptions) => request<T>('PATCH', path, body, options),
    delete: <T>(path: string, options?: ApiOptions) => request<T>('DELETE', path, undefined, options)
  }
}
