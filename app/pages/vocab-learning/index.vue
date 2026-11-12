<script setup lang="ts">
import type { VocabSet } from '~/types/vocab'
// Imported explicitly: auto-imported components are only available in templates, not in script code
import AdminVocabSetForm from '~/components/admin/VocabSetForm.vue'

// Public vocabulary learning screen: same structure as the home screen (hero banner + titled grid of sets)
definePageMeta({ layout: 'user' })
usePageSeo({
  title: 'Học từ vựng theo bộ từ',
  description: 'Học và ghi nhớ từ vựng theo từng bộ từ, luyện tập mọi lúc mọi nơi. Miễn phí.'
})

const api = useVocabApi()
const authStore = useAuthStore()
const dialogStore = useDialogStore()

// Signed-in users can create their own set; the owner id is sent so the backend registers it to them
async function openCreateSet() {
  const userId = authStore.user?.userId
  if (userId === undefined) return
  const saved = await dialogStore.content<boolean>({
    title: 'Bộ từ vựng mới',
    component: AdminVocabSetForm,
    props: { userId }
  })
  if (saved) await refresh()
}

// Search text filters the loaded sets in the browser (the backend no longer searches by keyword)
const search = ref('')
const keyword = computed(() => search.value.trim().toLowerCase())

// Sets are loaded by the signed-in user's id (all sets when signed out). The user is already restored by
// plugins/auth.ts (also on the server), so the list is requested once with the right id.
// A failed request is shown inline (loadError) and never throws.
const userId = computed(() => authStore.user?.userId)
// The user id the current list was loaded for; lets us skip a reload when nothing really changed
let loadedFor: number | undefined
const { data, status, refresh } = await useAsyncData(
  'vocab-sets',
  async () => {
    loadedFor = userId.value
    try {
      return { sets: await api.listSets(loadedFor), error: '' }
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
      return { sets: [] as VocabSet[], error: e.message }
    }
  },
  { default: () => ({ sets: [] as VocabSet[], error: '' }) }
)

// Reload only when the user really changes later (sign-in / sign-out in another tab or from the header)
watch(userId, (id) => {
  if (id !== loadedFor) refresh()
})

const allSets = computed(() => data.value.sets)
const loadError = computed(() => data.value.error)
// Local filter over name and description
const sets = computed(() => {
  if (!keyword.value) return allSets.value
  return allSets.value.filter(s => [s.name, s.description ?? ''].some(f => f.toLowerCase().includes(keyword.value)))
})
const wordTotal = computed(() => sets.value.reduce((sum, s) => sum + (s.wordNum ?? 0), 0))
// Only the first load shows skeletons; searching keeps cards on screen so they animate smoothly
const loading = computed(() => status.value === 'pending' && !allSets.value.length)
</script>

<template>
  <div class="flex flex-col gap-12">
    <!-- Hero banner: violet to match the promo strip on the home screen -->
    <section class="relative isolate overflow-hidden rounded-3xl border border-violet-200/70 bg-linear-to-br from-violet-50 via-violet-100 to-violet-200/80 px-5 py-7 text-center sm:px-12 sm:py-10 dark:border-violet-900/40 dark:from-violet-950 dark:via-neutral-900 dark:to-neutral-950">
      <!-- Decorative blobs: slow floating motion, purely visual -->
      <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div class="animate-float-slow absolute -top-20 -left-16 size-64 rounded-full bg-violet-300/40 blur-3xl dark:bg-violet-700/25" />
        <div class="animate-float-slow absolute -right-16 -bottom-24 size-72 rounded-full bg-violet-300/50 blur-3xl [animation-delay:2s] dark:bg-violet-600/20" />
      </div>

      <h1 class="animate-fade-up mx-auto max-w-3xl text-2xl leading-tight font-extrabold tracking-tight text-highlighted sm:text-4xl">
        Học từ vựng
        <span class="bg-linear-to-r from-violet-600 to-violet-400 bg-clip-text text-transparent">nhanh và dễ nhớ</span>
      </h1>
      <p class="animate-fade-up mx-auto mt-2 max-w-xl text-sm text-muted [--index:1] sm:text-base">
        Chọn một bộ từ vựng và bắt đầu ghi nhớ từ mới mỗi ngày.
      </p>

      <!-- Search + stats on one row to keep the banner short -->
      <div class="animate-fade-up mt-5 flex flex-col items-center gap-4 [--index:2] sm:flex-row sm:justify-center sm:gap-6">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Tìm bộ từ vựng..."
          size="lg"
          class="w-full sm:max-w-xs"
          aria-label="Tìm bộ từ vựng"
        />
        <dl v-if="sets.length" class="flex flex-wrap justify-center gap-2">
          <div class="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <UIcon name="i-lucide-library" class="size-4 text-violet-600 dark:text-violet-400" />
            <dt class="sr-only">Bộ từ vựng</dt>
            <dd class="font-bold text-highlighted">{{ sets.length.toLocaleString('vi-VN') }}</dd>
            <span class="text-muted" aria-hidden="true">Bộ từ</span>
          </div>
          <div class="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
            <UIcon name="i-lucide-languages" class="size-4 text-violet-600 dark:text-violet-400" />
            <dt class="sr-only">Từ vựng</dt>
            <dd class="font-bold text-highlighted">{{ wordTotal.toLocaleString('vi-VN') }}</dd>
            <span class="text-muted" aria-hidden="true">Từ vựng</span>
          </div>
        </dl>
      </div>
    </section>

    <!-- Inline error with retry so a failed request never leaves the page blank -->
    <UAlert
      v-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Không thể tải danh sách bộ từ vựng"
      :description="loadError"
      :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => refresh() }]"
    />

    <section v-else class="animate-fade-up">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h2 class="flex items-center gap-2 text-xl font-bold text-highlighted sm:text-2xl">
          <span class="flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
            <UIcon name="i-lucide-library" class="size-5" />
          </span>
          Tất cả bộ từ vựng
          <UBadge v-if="!loading && sets.length" :label="String(sets.length)" color="neutral" variant="subtle" size="sm" />
        </h2>
        <!-- Only for signed-in users -->
        <UButton
          v-if="authStore.isLoggedIn"
          icon="i-lucide-plus"
          class="shrink-0 transition duration-200 active:scale-95"
          @click="openCreateSet"
        >
          Tạo bộ từ
        </UButton>
      </div>

      <!-- Loading: skeleton squares -->
      <div v-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        <USkeleton v-for="n in 4" :key="n" class="aspect-square rounded-2xl" />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!sets.length"
        class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default py-10 text-center"
      >
        <UIcon name="i-lucide-search-x" class="size-8 text-muted" />
        <p class="text-sm text-muted">{{ keyword ? 'Không có bộ từ vựng nào khớp với tìm kiếm' : 'Chưa có bộ từ vựng nào' }}</p>
      </div>

      <!-- Cards; TransitionGroup animates search filtering, --index staggers the first render -->
      <TransitionGroup
        v-else
        name="card"
        tag="div"
        class="relative grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
      >
        <UserVocabSetCard
          v-for="(set, i) in sets"
          :key="set.id"
          :set="set"
          class="animate-fade-up"
          :style="{ '--index': i }"
        />
      </TransitionGroup>
    </section>
  </div>
</template>
