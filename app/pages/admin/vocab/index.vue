<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { VocabSet, VocabWord } from '~/types/vocab'
// Imported explicitly: auto-imported components are only available in templates, not in script code
import AdminVocabSetForm from '~/components/admin/VocabSetForm.vue'
import AdminVocabWordForm from '~/components/admin/VocabWordForm.vue'

// Admin vocabulary management: a table of sets, and below it the words of the selected set.
// Sets have create / edit / delete; words have create / edit (the backend has no word delete endpoint yet).
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Từ vựng' })

const api = useVocabAdminApi()
const dialogStore = useDialogStore()

// Client-side only: the API call needs the browser cookie and errors open a dialog
const { data: sets, status, error, refresh } = await useAsyncData(
  'admin-vocab-sets',
  () => api.listSets(),
  { server: false, default: () => [] as VocabSet[] }
)
// Show the table loader only after mount to avoid a hydration mismatch (same approach as the subject screen)
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const loading = computed(() => mounted.value && status.value === 'pending')

// ---- Sets: search + pagination (the list endpoint returns everything, so both run in the browser) ----
const search = ref('')
const page = ref(1)
const pageSize = 10

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sets.value
  return sets.value.filter(s => [s.name, s.slug, s.description ?? ''].some(f => f.toLowerCase().includes(q)))
})
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
watch(search, () => { page.value = 1 })
// Keep the page valid after deletions shrink the list
watch(filtered, (rows) => {
  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize))
  if (page.value > lastPage) page.value = lastPage
})

const setColumns: TableColumn<VocabSet>[] = [
  { accessorKey: 'name', header: 'Tên' },
  { accessorKey: 'wordNum', header: 'Số từ' },
  { accessorKey: 'description', header: 'Mô tả' },
  { accessorKey: 'updatedAt', header: 'Cập nhật' },
  { id: 'actions', header: '' }
]

// Create/edit a set in the global content dialog; reload the list when something was saved
async function openSetForm(set?: VocabSet) {
  const saved = await dialogStore.content<boolean>({
    title: set ? 'Sửa bộ từ vựng' : 'Bộ từ vựng mới',
    component: AdminVocabSetForm,
    props: { set }
  })
  if (saved) await refresh()
}

// Confirm, then delete the set (the backend also deletes its words); close the word panel if it was open
async function removeSet(set: VocabSet) {
  const ok = await dialogStore.confirm({
    title: 'Xóa bộ từ vựng',
    description: `Bạn có chắc muốn xóa "${set.name}" cùng toàn bộ từ vựng bên trong? Hành động này không thể hoàn tác.`,
    confirmText: 'Xóa',
    confirmColor: 'error'
  })
  if (!ok) return
  try {
    await api.removeSet(set.id)
    if (selected.value?.id === set.id) selected.value = null
    await refresh()
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  }
}

// ---- Words of the selected set ----
const selected = ref<VocabSet | null>(null)
const words = ref<VocabWord[]>([])
const wordsLoading = ref(false)
const wordsError = ref('')
const wordSearch = ref('')

const filteredWords = computed(() => {
  const q = wordSearch.value.trim().toLowerCase()
  if (!q) return words.value
  return words.value.filter(w => `${w.word} ${w.meaning}`.toLowerCase().includes(q))
})

const wordColumns: TableColumn<VocabWord>[] = [
  { accessorKey: 'word', header: 'Từ vựng' },
  { accessorKey: 'wordType', header: 'Loại từ' },
  { accessorKey: 'wordLevel', header: 'Cấp độ' },
  { accessorKey: 'meaning', header: 'Nghĩa' },
  { accessorKey: 'example', header: 'Ví dụ' },
  { id: 'actions', header: '' }
]

// Readable label for a word type code (falls back to the raw code)
const typeLabel = (type: string | null) => VOCAB_WORD_TYPES.find(t => t.value === type)?.label ?? type ?? '—'

async function loadWords() {
  if (!selected.value) return
  wordsLoading.value = true
  wordsError.value = ''
  try {
    words.value = await api.listWords(selected.value.id)
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
    words.value = []
    wordsError.value = e.message
  } finally {
    wordsLoading.value = false
  }
}

// Show the words of a set and scroll the panel into view
async function selectSet(set: VocabSet) {
  selected.value = set
  wordSearch.value = ''
  await loadWords()
  await nextTick()
  document.getElementById('vocab-words')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Create/edit a word; reload the words and the set list (word counts) when something was saved
async function openWordForm(word?: VocabWord) {
  if (!selected.value) return
  const saved = await dialogStore.content<boolean>({
    title: word ? 'Sửa từ vựng' : 'Từ vựng mới',
    component: AdminVocabWordForm,
    props: { setId: selected.value.id, word },
    widthClass: 'sm:max-w-2xl'
  })
  if (saved) await Promise.all([loadWords(), refresh()])
}

</script>

<template>
  <div class="space-y-6">
    <!-- Page header with the primary action -->
    <div class="motion-safe:animate-fade-up flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Từ vựng
        </h1>
        <p class="text-sm text-muted">
          Quản lý các bộ từ vựng và từ vựng bên trong từng bộ.
        </p>
      </div>
      <UButton icon="i-lucide-plus" class="transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95" @click="openSetForm()">
        Bộ từ vựng mới
      </UButton>
    </div>

    <!-- Sets table card -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }" class="motion-safe:animate-fade-up" style="--index: 1">
      <!-- Toolbar: search + count -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-default p-4">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Tìm theo tên, slug hoặc mô tả"
          class="w-full sm:max-w-sm"
          aria-label="Tìm kiếm bộ từ vựng"
        >
          <template v-if="search" #trailing>
            <UButton icon="i-lucide-x" color="neutral" variant="link" size="xs" aria-label="Xóa tìm kiếm" @click="search = ''" />
          </template>
        </UInput>
        <span class="text-sm text-muted">{{ filtered.length }} bộ từ vựng</span>
      </div>

      <!-- Load error with retry -->
      <UAlert
        v-if="error"
        class="m-4"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Không thể tải danh sách bộ từ vựng"
        :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />

      <!-- Client-only: the data is fetched in the browser, so SSR output could never match -->
      <ClientOnly v-else>
        <template #fallback>
          <div class="space-y-3 p-4">
            <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
          </div>
        </template>

        <UTable :data="pagedRows" :columns="setColumns" :loading="loading" class="[&_tbody_tr]:transition-colors">
          <template #name-cell="{ row }">
            <span class="font-medium text-highlighted">{{ row.original.name }}</span>
          </template>
          <template #wordNum-cell="{ row }">
            <UBadge color="primary" variant="subtle" :label="String(row.original.wordNum ?? 0)" />
          </template>
          <template #description-cell="{ row }">
            <span class="line-clamp-2 max-w-xs text-muted">{{ row.original.description || '—' }}</span>
          </template>
          <template #updatedAt-cell="{ row }">
            <span class="whitespace-nowrap text-muted">{{ formatDateTime(row.original.updatedAt) }}</span>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <!-- Opens the word panel below -->
              <UButton
                icon="i-lucide-list"
                color="neutral"
                variant="soft"
                size="sm"
                class="transition duration-200 active:scale-95"
                @click="selectSet(row.original)"
              >
                Từ vựng
              </UButton>
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                :aria-label="`Sửa ${row.original.name}`"
                class="transition duration-200 active:scale-95"
                @click="openSetForm(row.original)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                :aria-label="`Xóa ${row.original.name}`"
                class="transition duration-200 active:scale-95"
                @click="removeSet(row.original)"
              />
            </div>
          </template>

          <!-- Empty state: differs for "no data yet" and "no search match" -->
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-10 text-center">
              <UIcon name="i-lucide-inbox" class="size-10 text-dimmed" />
              <p class="text-sm text-muted">
                {{ search ? 'Không có bộ từ vựng nào khớp với tìm kiếm.' : 'Chưa có bộ từ vựng nào. Hãy tạo bộ đầu tiên.' }}
              </p>
              <UButton v-if="!search" icon="i-lucide-plus" variant="soft" @click="openSetForm()">
                Bộ từ vựng mới
              </UButton>
            </div>
          </template>
        </UTable>
      </ClientOnly>

      <!-- Pagination, only when more than one page -->
      <div v-if="filtered.length > pageSize" class="flex justify-end border-t border-default p-4">
        <UPagination v-model:page="page" :items-per-page="pageSize" :total="filtered.length" />
      </div>
    </UCard>

    <!-- Words of the selected set; scroll-mt keeps the title clear of the sticky header -->
    <Transition name="card">
      <UCard v-if="selected" id="vocab-words" :ui="{ body: 'p-0 sm:p-0' }" class="scroll-mt-20">
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="min-w-0">
              <h2 class="truncate text-lg font-bold text-highlighted">
                Từ vựng: {{ selected.name }}
              </h2>
              <p class="text-sm text-muted">
                {{ words.length }} từ
              </p>
            </div>
            <div class="flex gap-2">
              <UButton color="neutral" variant="ghost" icon="i-lucide-x" class="transition duration-200 active:scale-95" @click="selected = null">
                Đóng
              </UButton>
              <UButton icon="i-lucide-plus" class="transition duration-200 active:scale-95" @click="openWordForm()">
                Thêm từ
              </UButton>
            </div>
          </div>
        </template>

        <!-- Word search -->
        <div class="border-b border-default p-4">
          <UInput
            v-model="wordSearch"
            icon="i-lucide-search"
            placeholder="Tìm theo từ hoặc nghĩa"
            class="w-full sm:max-w-sm"
            aria-label="Tìm kiếm từ vựng"
          />
        </div>

        <!-- Load error with retry -->
        <UAlert
          v-if="wordsError"
          class="m-4"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Không thể tải danh sách từ vựng"
          :description="wordsError"
          :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => loadWords() }]"
        />

        <UTable v-else :data="filteredWords" :columns="wordColumns" :loading="wordsLoading" class="[&_tbody_tr]:transition-colors">
          <template #word-cell="{ row }">
            <div>
              <span class="font-medium text-highlighted">{{ row.original.word }}</span>
              <span v-if="row.original.phonetic" class="block text-xs text-muted">{{ row.original.phonetic }}</span>
            </div>
          </template>
          <template #wordType-cell="{ row }">
            <span class="whitespace-nowrap text-muted">{{ typeLabel(row.original.wordType) }}</span>
          </template>
          <template #wordLevel-cell="{ row }">
            <UBadge v-if="row.original.wordLevel" color="neutral" variant="subtle" :label="row.original.wordLevel" />
            <span v-else class="text-muted">—</span>
          </template>
          <template #meaning-cell="{ row }">
            <span class="line-clamp-2 max-w-xs whitespace-normal">{{ row.original.meaning }}</span>
          </template>
          <template #example-cell="{ row }">
            <span class="line-clamp-2 max-w-xs whitespace-normal text-muted">{{ row.original.example || '—' }}</span>
          </template>
          <template #actions-cell="{ row }">
            <div class="flex justify-end gap-1">
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                :aria-label="`Sửa ${row.original.word}`"
                class="transition duration-200 active:scale-95"
                @click="openWordForm(row.original)"
              />
            </div>
          </template>

          <template #empty>
            <div class="flex flex-col items-center gap-3 py-10 text-center">
              <UIcon name="i-lucide-inbox" class="size-10 text-dimmed" />
              <p class="text-sm text-muted">
                {{ wordSearch ? 'Không có từ nào khớp với tìm kiếm.' : 'Bộ này chưa có từ vựng nào.' }}
              </p>
              <UButton v-if="!wordSearch" icon="i-lucide-plus" variant="soft" @click="openWordForm()">
                Thêm từ
              </UButton>
            </div>
          </template>
        </UTable>
      </UCard>
    </Transition>
  </div>
</template>
