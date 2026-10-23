// Questions the learner marked as understood, kept in localStorage as { [subjectId]: [questionId, ...] }
const STORAGE_KEY = 'practice:learned'

export const useLearnedStore = defineStore('learned', () => {
  const learned = ref<Record<string, number[]>>({})

  // Read the saved data; must run on the client only (localStorage). Bad or blocked storage is ignored.
  function load() {
    try {
      const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        learned.value = parsed as Record<string, number[]>
      }
    } catch {
      // Corrupted JSON or storage unavailable: start empty
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(learned.value))
    } catch {
      // Storage full or blocked: progress just stays in memory for this visit
    }
  }

  const isLearned = (subjectId: number, questionId: number) =>
    learned.value[subjectId]?.includes(questionId) ?? false

  // Tick or untick a question and persist right away
  function setLearned(subjectId: number, questionId: number, value: boolean) {
    const ids = (learned.value[subjectId] ?? []).filter(id => id !== questionId)
    if (value) ids.push(questionId)
    learned.value = { ...learned.value, [subjectId]: ids }
    save()
  }

  // A subject is "studying" once it has an entry (even an empty one) in the saved data
  const isStudying = (subjectId: number) => String(subjectId) in learned.value

  // Number of ticked questions of a subject
  const countLearned = (subjectId: number) => learned.value[subjectId]?.length ?? 0

  // Mark a subject as studying by saving { subjectId: [] } when it is opened for the first time
  function startStudying(subjectId: number) {
    if (isStudying(subjectId)) return
    learned.value = { ...learned.value, [subjectId]: [] }
    save()
  }

  return { learned, load, isLearned, setLearned, isStudying, countLearned, startStudying }
})
