// App-wide UI state shared by every screen
export const useAppStore = defineStore('app', () => {
  // Counter instead of a boolean so overlapping requests don't hide the loader early
  const pendingCount = ref(0)
  const isLoading = computed(() => pendingCount.value > 0)

  function startLoading() {
    pendingCount.value++
  }

  function stopLoading() {
    pendingCount.value = Math.max(0, pendingCount.value - 1)
  }

  return { isLoading, startLoading, stopLoading }
})
