<script setup lang="ts">
import type { UserSubject } from '~/types/userSubject'

// Public home: all subjects on top, subjects the user is studying below
definePageMeta({ layout: 'user' })
useSeoMeta({ title: 'Trang chủ' })

const route = useRoute()
const authStore = useAuthStore()
const learnedStore = useLearnedStore()
const api = useUserSubjectApi()

const allSubjects = ref<UserSubject[]>([])
// Unfiltered subject list, used to resolve the studying ids saved in localStorage
const catalog = ref<UserSubject[]>([])
const loadingAll = ref(true)
const loadingCatalog = ref(true)
// Message of the last failed load of the subject list, empty when OK
const loadError = ref('')

// Search keyword from the header (?q=); the backend does the filtering
const keyword = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))

// "Studying" = every subject id stored in practice:learned (no login, no backend), with progress from the ticks
const studying = computed<UserSubject[]>(() => {
  const k = keyword.value.toLowerCase()
  return catalog.value
    .filter(s => learnedStore.isStudying(s.id))
    .map(s => ({
      ...s,
      progress: s.questionCount ? Math.min(100, Math.round((learnedStore.countLearned(s.id) / s.questionCount) * 100)) : 0
    }))
    // Keyword filter is local since this list has no backend search
    .filter(s => !k || `${s.name} ${s.description ?? ''}`.toLowerCase().includes(k))
})

// Load on mount and whenever the keyword changes. Errors are shown inline (see loadError).
// Only the first load shows skeletons; later searches keep the cards on screen so they animate smoothly.
let requestId = 0
async function loadSubjects() {
  const id = ++requestId
  try {
    const result = await api.listAll(keyword.value)
    // Ignore stale responses when the user typed again meanwhile
    if (id === requestId) {
      allSubjects.value = result
      loadError.value = ''
    }
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
    if (id === requestId) loadError.value = e.message
  } finally {
    if (id === requestId) loadingAll.value = false
  }
}

// Load the full list once for the studying section; failures just leave that section empty
async function loadCatalog() {
  try {
    catalog.value = await api.listAll()
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  } finally {
    loadingCatalog.value = false
  }
}

// localStorage is only available in the browser
onMounted(() => {
  learnedStore.load()
  loadSubjects()
  loadCatalog()
})
watch(keyword, loadSubjects)
</script>

<template>
  <div class="space-y-12">
    <!-- Hero greeting -->
    <div class="animate-fade-up text-center">
      <h1 class="text-3xl font-bold text-highlighted sm:text-4xl">
        {{ authStore.isLoggedIn ? `Chào mừng trở lại, ${authStore.user?.firstName || authStore.user?.username}` : 'Luyện tập tạo nên thành công' }}
      </h1>
      <p class="mt-2 text-muted">Chọn một môn học và bắt đầu luyện tập.</p>
    </div>

    <!-- Inline error with retry so a failed request never leaves the page blank -->
    <UAlert
      v-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Không thể tải danh sách môn học"
      :description="loadError"
      :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: loadSubjects }]"
    />

    <UserSubjectSection
      v-else
      title="Tất cả môn học"
      :subjects="allSubjects"
      :loading="loadingAll"
      :empty-text="keyword ? 'Không có môn học nào khớp với tìm kiếm' : 'Chưa có môn học nào'"
      empty-icon="i-lucide-search-x"
    />

    <UserSubjectSection
      title="Đang học"
      :subjects="studying"
      :loading="loadingCatalog"
      empty-text="Bạn chưa bắt đầu môn học nào. Hãy chọn một môn ở trên!"
      empty-icon="i-lucide-graduation-cap"
    />
  </div>
</template>
