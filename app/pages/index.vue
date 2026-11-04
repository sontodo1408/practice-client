<script setup lang="ts">
import type { UserSubject } from '~/types/userSubject'

// Public home: all subjects on top, subjects the user is studying below
definePageMeta({ layout: 'user' })
// SEO: the keywords people search for ("câu hỏi phỏng vấn") are in the title, description and h1
const { origin } = usePageSeo({
  title: 'Câu hỏi phỏng vấn lập trình có đáp án và chấm điểm AI',
  description: 'Tổng hợp bộ câu hỏi phỏng vấn lập trình theo từng công nghệ (Java, Spring, SQL...), có đáp án chi tiết và chấm điểm câu trả lời bằng AI. Luyện tập miễn phí.'
})
// Structured data: tells search engines this is a site with an internal search (?q=)
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      'name': 'Practice',
      'url': `${origin}/`,
      'inLanguage': 'vi',
      'potentialAction': {
        '@type': 'SearchAction',
        'target': `${origin}/?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    })
  }]
})

const route = useRoute()
const authStore = useAuthStore()
const learnedStore = useLearnedStore()
const api = useUserSubjectApi()

// Unfiltered subject list, used to resolve the studying ids saved in localStorage
const catalog = ref<UserSubject[]>([])
const loadingCatalog = ref(true)

// Search keyword from the header (?q=); the backend does the filtering
const keyword = computed(() => (typeof route.query.q === 'string' ? route.query.q.trim() : ''))

// All subjects are loaded on the server too (links must be in the HTML for crawlers) and reloaded when the
// keyword changes. Errors are shown inline (see loadError); a failed request never throws out of the page.
const { data: listData, status, refresh } = await useAsyncData(
  'home-subjects',
  async () => {
    try {
      return { subjects: await api.listAll(keyword.value), error: '' }
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
      return { subjects: [] as UserSubject[], error: e.message }
    }
  },
  { watch: [keyword], default: () => ({ subjects: [] as UserSubject[], error: '' }) }
)
const allSubjects = computed(() => listData.value.subjects)
const loadError = computed(() => listData.value.error)
// Only the first load shows skeletons; later searches keep the cards on screen so they animate smoothly
const loadingAll = computed(() => status.value === 'pending' && !allSubjects.value.length)

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
  loadCatalog()
})
</script>

<template>
  <div class="space-y-12">
    <!-- Hero greeting -->
    <div class="animate-fade-up text-center">
      <h1 class="text-3xl font-bold text-highlighted sm:text-4xl">
        {{ authStore.isLoggedIn ? `Chào mừng trở lại, ${authStore.user?.firstName || authStore.user?.username}` : 'Bộ câu hỏi phỏng vấn lập trình' }}
      </h1>
      <p class="mt-2 text-muted">Chọn một bộ câu hỏi và bắt đầu luyện tập.</p>
    </div>

    <!-- Inline error with retry so a failed request never leaves the page blank -->
    <UAlert
      v-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Không thể tải danh sách bộ câu hỏi"
      :description="loadError"
      :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => refresh() }]"
    />

    <UserSubjectSection
      v-else
      title="Tất cả bộ câu hỏi"
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
