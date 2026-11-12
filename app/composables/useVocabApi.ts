import type { VocabSet, VocabSetDetail, VocabSetPayload, VocabWordPayload } from '~/types/vocab'

// Calls for the vocabulary learning screen (LearnVocabController in practice-service, mapped under /vocab).
// Errors are silent and never redirect to login: the screen shows them inline.
export function useVocabApi() {
  const api = useApi()
  const options = { silent: true, skipAuthRedirect: true }

  return {
    // GET /practice/vocab/set?userId= : sets of that user. The backend returns every set when userId is null,
    // so an undefined id is simply left out of the query. Text search is done in the browser, not here.
    listSets: (userId?: number) =>
      api.get<VocabSet[]>('/practice/vocab/set', { ...options, query: { userId } }),
    // GET /practice/vocab/set/{slug}: one set with all its words
    getSet: (slug: string) => api.get<VocabSetDetail>(`/practice/vocab/set/${slug}`, options),
    // POST /practice/vocab/set: signed-in user creates a set; the payload must carry userId (owner).
    // Not silent: success toast and error dialog come from useApi.
    saveSet: (payload: VocabSetPayload) => api.post<void>('/practice/vocab/set', payload),
    // POST /practice/vocab/word: add (or update by id) a word of a set; @RequestBody, so a JSON body
    saveWord: (payload: VocabWordPayload) => api.post<void>('/practice/vocab/word', payload)
  }
}
