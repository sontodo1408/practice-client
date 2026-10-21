import type { Subject, SubjectPayload } from '~/types/subject'

// CRUD calls for /practice/admin/subject (AdminSubjectController). Success toasts come from useApi.
export function useSubjectApi() {
  const api = useApi()
  const base = '/practice/admin/subject'

  return {
    list: () => api.get<Subject[]>(base),
    create: (payload: SubjectPayload) => api.post<Subject>(base, payload),
    update: (id: number, payload: SubjectPayload) => api.put<Subject>(`${base}/${id}`, payload),
    remove: (id: number) => api.delete<void>(`${base}/${id}`)
  }
}
