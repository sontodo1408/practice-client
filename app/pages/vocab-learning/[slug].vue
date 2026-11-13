<script setup lang="ts">
import type { VocabFocus, VocabSetDetail } from '~/types/vocab'
// Imported explicitly: auto-imported components are only available in templates, not in script code
import AdminVocabWordForm from '~/components/admin/VocabWordForm.vue'

// Vocabulary set page: centered two-column layout. Left: small sidebar with the study modes.
// Right: the selected mode (flashcards / multiple choice / write sentences).
definePageMeta({ layout: 'user' })

const route = useRoute()
const api = useVocabApi()
const authStore = useAuthStore()
const dialogStore = useDialogStore()
const slug = computed(() => String(route.params.slug))

// Loaded on the server too; a failed request is shown inline and never throws out of the page
const { data, status, refresh } = await useAsyncData(
  () => `vocab-set-${slug.value}`,
  async () => {
    try {
      return { set: await api.getSet(slug.value), error: '' }
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
      return { set: null as VocabSetDetail | null, error: e.message }
    }
  },
  { watch: [slug] }
)
const set = computed(() => data.value?.set ?? null)
const loadError = computed(() => data.value?.error ?? '')
const words = computed(() => set.value?.vocabWords ?? [])
const loading = computed(() => status.value === 'pending' && !set.value)

usePageSeo({
  title: () => (set.value ? `Học từ vựng ${set.value.name}` : 'Bộ từ vựng'),
  description: () => toSnippet(set.value?.description || `Học ${words.value.length} từ vựng bằng thẻ ghi nhớ, trắc nghiệm và đặt câu.`),
  image: () => (set.value?.imgBanner ? imgUrl(set.value.imgBanner) : null)
})
// An unknown slug answers with a real 404 status for search engines (same as the subject screen)
if (!set.value && !loadError.value && import.meta.server) setResponseStatus(useRequestEvent()!, 404)
// Structured data: lets search engines show the set as a course
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: () => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      'name': set.value?.name,
      'description': set.value?.description ?? undefined,
      'inLanguage': 'vi'
    })
  }]
})

// True only when a user is signed in and owns this set
const isOwner = computed(() => {
  const currentUserId = authStore.user?.userId
  return currentUserId !== undefined && set.value?.userId != null && set.value.userId === currentUserId
})

// The owner can add a word to this set; reload the set afterwards so the new word shows up
async function openAddWord() {
  if (!set.value) return
  const saved = await dialogStore.content<boolean>({
    title: 'Từ vựng mới',
    component: AdminVocabWordForm,
    props: { setId: set.value.id, user: true },
    widthClass: 'sm:max-w-2xl'
  })
  if (saved) await refresh()
}

// Search box: pick a word and every study mode jumps to it. The menu is reset after each pick so the same word can be searched again.
// Big sets make a full dropdown slow, so: (1) the typed text is debounced, (2) the scan stops at the first
// SEARCH_LIMIT matches and (3) only those matches are rendered (the menu's own filter is off via ignore-filter).
const SEARCH_LIMIT = 10
const SEARCH_DELAY = 300
// Lowercased text to match against, computed once per set instead of on every keystroke
const searchIndex = computed(() => words.value.map(w => ({
  id: w.id,
  label: `${w.word} — ${w.meaning}`,
  key: `${w.word} ${w.meaning}`.toLowerCase()
})))
const searchTerm = ref('')
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchTerm, (text) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { searchQuery.value = text.trim().toLowerCase() }, SEARCH_DELAY)
})
onBeforeUnmount(() => clearTimeout(searchTimer))
const searchItems = computed(() => {
  const q = searchQuery.value
  const found: { label: string, value: number }[] = []
  if (!q) return found
  for (const item of searchIndex.value) {
    if (!item.key.includes(q)) continue
    found.push({ label: item.label, value: item.id })
    if (found.length >= SEARCH_LIMIT) break
  }
  return found
})
const searchValue = ref<number | undefined>()
const focus = ref<VocabFocus | null>(null)
watch(searchValue, (id) => {
  if (id === undefined) return
  focus.value = { id, n: Date.now() }
  clearTimeout(searchTimer)
  searchTerm.value = ''
  searchQuery.value = ''
  nextTick(() => { searchValue.value = undefined })
})

// Study modes shown in the sidebar
const modes = [
  { id: 'flashcard', label: 'Thẻ ghi nhớ', icon: 'i-lucide-layers' },
  { id: 'study', label: 'Học tập', icon: 'i-lucide-graduation-cap' },
  { id: 'sentence', label: 'Đặt câu', icon: 'i-lucide-pen-line' }
] as const
type ModeId = (typeof modes)[number]['id']

// The mode lives in ?mode= so it survives a reload and can be shared
const mode = computed<ModeId>(() => modes.find(m => m.id === route.query.mode)?.id ?? 'flashcard')
function selectMode(id: ModeId) {
  navigateTo({ query: { ...route.query, mode: id } }, { replace: true })
}
</script>

<template>
  <div>
    <!-- Loading skeleton with the same two-column shape -->
    <div v-if="loading" class="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <USkeleton class="h-48 rounded-2xl" />
      <USkeleton class="h-96 rounded-2xl" />
    </div>

    <!-- Unknown slug -->
    <div v-else-if="!set && !loadError" class="flex flex-col items-center gap-3 py-16 text-center">
      <UIcon name="i-lucide-search-x" class="size-10 text-muted" />
      <p class="text-lg font-semibold text-highlighted">Không tìm thấy bộ từ vựng</p>
      <UButton to="/vocab-learning" icon="i-lucide-arrow-left" class="active:scale-95">Về danh sách</UButton>
    </div>

    <!-- Request failed -->
    <UAlert
      v-else-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Không thể tải bộ từ vựng này"
      :description="loadError"
      :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => refresh() }]"
    />

    <div v-else-if="set" class="animate-fade-up">
      <AppBreadcrumb :items="[{ label: 'Học từ vựng', to: '/vocab-learning' }, { label: set.name }]" class="mb-4" />

      <div class="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <h1 class="text-2xl font-extrabold tracking-tight text-highlighted sm:text-3xl">{{ set.name }}</h1>
          <p v-if="set.description" class="mt-1 text-sm text-muted sm:text-base">{{ set.description }}</p>
        </div>
        <div class="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto">
          <!-- Search a word of this set; the active study mode jumps to it -->
          <UInputMenu
            v-if="words.length"
            v-model="searchValue"
            v-model:search-term="searchTerm"
            value-key="value"
            :items="searchItems"
            ignore-filter
            :open-on-focus="false"
            :open-on-click="false"
            icon="i-lucide-search"
            :ui="{ trailingIcon: 'hidden' }"
            placeholder="Tìm từ vựng..."
            aria-label="Tìm từ vựng trong bộ này"
            class="w-full sm:w-64"
          >
            <template #empty>Không có từ phù hợp</template>
          </UInputMenu>
          <!-- Only the owner of the set sees this: the set's userId must match the signed-in user -->
          <UButton
            v-if="isOwner"
            icon="i-lucide-plus"
            class="shrink-0 transition duration-200 active:scale-95"
            @click="openAddWord"
          >
            Thêm từ vựng
          </UButton>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[14rem_1fr]">
        <!-- Left: mode list; sticky on desktop, a row of buttons on top on mobile -->
        <aside class="lg:sticky lg:top-24 lg:self-start">
          <nav aria-label="Chế độ học" class="rounded-2xl border border-default bg-default p-2 lg:p-3">
            <p class="mb-2 hidden px-3 text-xs font-semibold tracking-wide text-muted uppercase lg:block">Chế độ học</p>
            <ul class="grid grid-cols-3 gap-1 lg:grid-cols-1">
              <li v-for="m in modes" :key="m.id">
                <button
                  type="button"
                  class="flex w-full flex-col items-center gap-1 rounded-lg px-2 py-2 text-xs transition duration-200 active:scale-[0.98] lg:flex-row lg:gap-2 lg:px-3 lg:text-sm"
                  :class="mode === m.id ? 'bg-brand-100 font-medium text-primary dark:bg-brand-950' : 'text-default hover:bg-elevated'"
                  :aria-current="mode === m.id ? 'page' : undefined"
                  @click="selectMode(m.id)"
                >
                  <UIcon :name="m.icon" class="size-5" />
                  {{ m.label }}
                </button>
              </li>
            </ul>
            <p class="mt-2 hidden px-3 text-xs text-muted lg:block">{{ words.length }} từ vựng</p>
          </nav>
        </aside>

        <!-- Right: selected mode; keyed so switching modes re-runs the enter animation and resets its state -->
        <div class="min-w-0">
          <div v-if="!words.length" class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default py-10 text-center">
            <UIcon name="i-lucide-inbox" class="size-8 text-muted" />
            <p class="text-sm text-muted">Bộ này chưa có từ vựng nào.</p>
          </div>
          <template v-else>
            <UserVocabFlashcards v-if="mode === 'flashcard'" :key="`f-${set.id}`" :words="words" :focus="focus" class="animate-fade-up" />
            <UserVocabQuiz v-else-if="mode === 'study'" :key="`q-${set.id}`" :words="words" :focus="focus" class="animate-fade-up" />
            <UserVocabSentence v-else :key="`s-${set.id}`" :words="words" :focus="focus" class="animate-fade-up" />
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
