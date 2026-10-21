import type { Setting, SettingPayload } from '~/types/setting'

// Calls for /practice/admin/setting (AdminSettingController). Success toasts come from useApi.
export function useSettingApi() {
  const api = useApi()
  const base = '/practice/admin/setting'

  return {
    // Silent: a missing setting (first run) is a normal state handled by the screen, not an error dialog
    get: () => api.get<Setting>(base, { silent: true }),
    // The backend upserts: it creates the row when no id is given
    update: (payload: SettingPayload) => api.post<void>(base, payload)
  }
}
