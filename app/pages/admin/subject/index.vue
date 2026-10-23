<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Subject } from '~/types/subject'
// Imported explicitly: auto-imported components are only available in templates, not in script code
import AdminSubjectForm from '~/components/admin/SubjectForm.vue'

// Admin subject management: searchable, paginated table with create / edit / delete
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Môn học' })

const subjectApi = useSubjectApi()
const dialogStore = useDialogStore()

// Client-side only: the API call needs the browser cookie and errors open a dialog
const { data: subjects, status, error, refresh } = await useAsyncData(
  'admin-subjects',
  () => subjectApi.list(),
  { server: false, default: () => [] as Subject[] }
)
// Show the table loader only after mount: on the server status is 'idle' but on the client it is
// already 'pending' while hydrating, which would cause a hydration class mismatch on the table header
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const loading = computed(() => mounted.value && status.value === 'pending')

// ---- Search + pagination (the list endpoint returns everything, so both run in the browser) ----
const search = ref('')
const page = ref(1)
const pageSize = 10

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return subjects.value
  return subjects.value.filter(s =>
    [s.name, s.slug, s.description ?? ''].some(field => field.toLowerCase().includes(q))
  )
})
const pagedRows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
// Jump back to the first page whenever the search changes
watch(search, () => { page.value = 1 })
// Keep the page valid after deletions shrink the list
watch(filtered, (rows) => {
  const lastPage = Math.max(1, Math.ceil(rows.length / pageSize))
  if (page.value > lastPage) page.value = lastPage
})

const columns: TableColumn<Subject>[] = [
  { accessorKey: 'name', header: 'Tên' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'description', header: 'Mô tả' },
  { accessorKey: 'updatedAt', header: 'Cập nhật' },
  { id: 'actions', header: '' }
]

// ---- Actions ----
// Open the create/edit form in the global content dialog; reload the list if something was saved
async function openForm(subject?: Subject) {
  const saved = await dialogStore.content<boolean>({
    title: subject ? 'Sửa môn học' : 'Môn học mới',
    component: AdminSubjectForm,
    props: { subject }
  })
  if (saved) await refresh()
}

// Ask for confirmation, then delete; API errors are shown by the global dialog
async function removeSubject(subject: Subject) {
  const ok = await dialogStore.confirm({
    title: 'Xóa môn học',
    description: `Bạn có chắc muốn xóa "${subject.name}"? Hành động này không thể hoàn tác.`,
    confirmText: 'Xóa',
    confirmColor: 'error'
  })
  if (!ok) return
  try {
    await subjectApi.remove(subject.id)
    await refresh()
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header with the primary action -->
    <div class="motion-safe:animate-fade-up flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-highlighted">
          Môn học
        </h1>
        <p class="text-sm text-muted">
          Quản lý các môn học mà người học có thể luyện tập.
        </p>
      </div>
      <UButton icon="i-lucide-plus" class="transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95" @click="openForm()">
        Môn học mới
      </UButton>
    </div>

    <!-- Table card -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }" class="motion-safe:animate-fade-up" style="--index: 1">
      <!-- Toolbar: search + count -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-default p-4">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Tìm theo tên, slug hoặc mô tả"
          class="w-full sm:max-w-sm"
          aria-label="Tìm kiếm môn học"
        >
          <template v-if="search" #trailing>
            <UButton icon="i-lucide-x" color="neutral" variant="link" size="xs" aria-label="Xóa tìm kiếm" @click="search = ''" />
          </template>
        </UInput>
        <span class="text-sm text-muted">{{ filtered.length }} môn học</span>
      </div>

      <!-- Load error with retry -->
      <UAlert
        v-if="error"
        class="m-4"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Không thể tải danh sách môn học"
        :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />

      <!-- Table is client-only: its data is fetched in the browser, so SSR output could never match
           and a fast API response during hydration caused intermittent hydration mismatches -->
      <ClientOnly v-else>
        <template #fallback>
          <!-- Skeleton rows shown on the server and until the table mounts -->
          <div class="space-y-3 p-4">
            <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
          </div>
        </template>

      <UTable
        :data="pagedRows"
        :columns="columns"
        :loading="loading"
        class="[&_tbody_tr]:transition-colors"
      >
        <template #name-cell="{ row }">
          <span class="font-medium text-highlighted">{{ row.original.name }}</span>
        </template>
        <template #slug-cell="{ row }">
          <UBadge color="primary" variant="subtle" :label="row.original.slug" />
        </template>
        <template #description-cell="{ row }">
          <span class="line-clamp-2 max-w-xs text-muted">{{ row.original.description || '—' }}</span>
        </template>
        <template #updatedAt-cell="{ row }">
          <span class="whitespace-nowrap text-muted">{{ formatDateTime(row.original.updatedAt) }}</span>
        </template>
        <template #actions-cell="{ row }">
          <div class="flex justify-end gap-1">
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              :aria-label="`Sửa ${row.original.name}`"
              class="transition duration-200 active:scale-95"
              @click="openForm(row.original)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              :aria-label="`Xóa ${row.original.name}`"
              class="transition duration-200 active:scale-95"
              @click="removeSubject(row.original)"
            />
          </div>
        </template>

        <!-- Empty state: differs for "no data yet" and "no search match" -->
        <template #empty>
          <div class="flex flex-col items-center gap-3 py-10 text-center">
            <UIcon name="i-lucide-inbox" class="size-10 text-dimmed" />
            <p class="text-sm text-muted">
              {{ search ? 'Không có môn học nào khớp với tìm kiếm.' : 'Chưa có môn học nào. Hãy tạo môn học đầu tiên.' }}
            </p>
            <UButton v-if="!search" icon="i-lucide-plus" variant="soft" @click="openForm()">
              Môn học mới
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
  </div>
</template>
