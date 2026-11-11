import type { VocabSet, VocabSetPayload, VocabWord, VocabWordPayload } from '~/types/vocab'

// Admin calls for vocabulary sets and words (AdminVocabController in practice-service, under /practice/admin/vocab).
// Success toasts and error dialogs come from useApi.
export function useVocabAdminApi() {
  const api = useApi()
  const base = '/practice/admin/vocab'

  return {
    // Sets: GET /set , POST /set (upsert by id), DELETE /set/{id}
    listSets: () => api.get<VocabSet[]>(`${base}/set`),
    saveSet: (payload: VocabSetPayload) => api.post<void>(`${base}/set`, payload),
    removeSet: (id: number) => api.delete<void>(`${base}/set/${id}`),
    // Words: GET /word/set/{setId} , POST /word (upsert by id)
    listWords: (setId: number) => api.get<VocabWord[]>(`${base}/word/set/${setId}`),
    // The backend method has no @RequestBody, so Spring binds request parameters, not JSON: send them as the query
    // string (undefined values are dropped). If @RequestBody is added there, switch this to a JSON body.
    saveWord: (payload: VocabWordPayload) => api.post<void>(`${base}/word`, undefined, { query: { ...payload } })
  }
}
