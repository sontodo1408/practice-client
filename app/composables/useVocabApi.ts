import type { VocabSet, VocabSetDetail } from '~/types/vocab'

// Calls for the vocabulary learning screen (LearnVocabController in practice-service, mapped under /vocab).
// Errors are silent and never redirect to login: the screen shows them inline.
export function useVocabApi() {
  const api = useApi()
  const options = { silent: true, skipAuthRedirect: true }

  return {
    // GET /practice/vocab/set?keyword= : the backend filters sets; empty keyword lists all
    listSets: (keyword = '') =>
      api.get<VocabSet[]>('/practice/vocab/set', { ...options, query: { keyword } }),
    // GET /practice/vocab/set/{slug}: one set with all its words
    getSet: (slug: string) => api.get<VocabSetDetail>(`/practice/vocab/set/${slug}`, options)
  }
}
