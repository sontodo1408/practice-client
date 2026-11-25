<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AdminUser, PageResponse } from '~/types/adminUser'
// Imported explicitly: it is opened from script code, where auto-imported components are unavailable
import BeanLimitForm from '~/components/admin/BeanLimitForm.vue'

// Admin user management: server-side searchable, paginated list of users with their bean usage
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Người dùng' })

const userApi = useAdminUserApi()
const dialogStore = useDialogStore()

// ---- Search + pagination (done by the backend) ----
const search = ref('')
// Active keyword sent to the API; only updated when Enter is pressed in the search box
const keyword = ref('')
const page = ref(1)
const pageSize = 10
// Apply the typed text as the active search and go back to the first page
function applySearch() {
  keyword.value = search.value.trim()
  page.value = 1
}
// Clear both the box and the active keyword
function clearSearch() {
  search.value = ''
  applySearch()
}

// Client-side only: the API call needs the browser cookie. Re-fetches when keyword or page changes.
const { data, status, error, refresh } = await useAsyncData<PageResponse<AdminUser>>(
  'admin-users',
  () => userApi.search({ keyword: keyword.value || undefined, pageNum: page.value, pageSize }),
  {
    server: false,
    watch: [keyword, page],
    default: () => ({ pageNum: 1, pageSize, totalRecord: 0, totalPage: 0, content: [] })
  }
)
// Avoid a hydration mismatch: on the server status is 'idle' but on the client it is already 'pending'
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const loading = computed(() => mounted.value && status.value === 'pending')
const total = computed(() => data.value.totalRecord)

const columns: TableColumn<AdminUser>[] = [
  { id: 'user', header: 'Người dùng' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Điện thoại' },
  { accessorKey: 'birthday', header: 'Ngày sinh' },
  { id: 'beans', header: 'Bean (còn lại / giới hạn ngày)' },
  { id: 'actions', header: '' }
]

// Open the bean limit popup for a user; reload the list if the limit was saved
async function openBeanLimit(user: AdminUser) {
  const saved = await dialogStore.content<boolean>({
    title: 'Giới hạn bean',
    component: BeanLimitForm,
    props: { user }
  })
  if (saved) await refresh()
}

// Best available display name for a user
function nameOf(user: AdminUser) {
  const full = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return user.displayName || full || user.username
}

// Date-only values (yyyy-MM-dd) formatted for the table
function formatDate(value: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="motion-safe:animate-fade-up">
      <h1 class="text-2xl font-bold text-highlighted">
        Người dùng
      </h1>
      <p class="text-sm text-muted">
        Danh sách người dùng và lượng bean còn lại của họ.
      </p>
    </div>

    <!-- Table card -->
    <UCard :ui="{ body: 'p-0 sm:p-0' }" class="motion-safe:animate-fade-up" style="--index: 1">
      <!-- Toolbar: search + count -->
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-default p-4">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Tìm theo tên đăng nhập (nhấn Enter)"
          class="w-full sm:max-w-sm"
          aria-label="Tìm kiếm người dùng"
          @keydown.enter="applySearch"
        >
          <template v-if="search" #trailing>
            <UButton icon="i-lucide-x" color="neutral" variant="link" size="xs" aria-label="Xóa tìm kiếm" @click="clearSearch" />
          </template>
        </UInput>
        <span class="text-sm text-muted">{{ total }} người dùng</span>
      </div>

      <!-- Load error with retry -->
      <UAlert
        v-if="error"
        class="m-4"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Không thể tải danh sách người dùng"
        :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />

      <!-- Client-only: data is fetched in the browser, so SSR output could never match -->
      <ClientOnly v-else>
        <template #fallback>
          <div class="space-y-3 p-4">
            <USkeleton v-for="i in 5" :key="i" class="h-10 w-full" />
          </div>
        </template>

        <!-- Wide table scrolls horizontally on small screens -->
        <UTable
          :data="data.content"
          :columns="columns"
          :loading="loading"
          class="[&_tbody_tr]:transition-colors"
        >
          <template #user-cell="{ row }">
            <div class="flex items-center gap-3">
              <UAvatar :src="row.original.avatarUrl || undefined" :alt="nameOf(row.original)" size="sm" />
              <div class="min-w-0">
                <p class="truncate font-medium text-highlighted">
                  {{ nameOf(row.original) }}
                </p>
                <p class="truncate text-xs text-muted">
                  @{{ row.original.username }}
                </p>
              </div>
            </div>
          </template>
          <template #email-cell="{ row }">
            <span class="text-muted">{{ row.original.email || '—' }}</span>
          </template>
          <template #phone-cell="{ row }">
            <span class="whitespace-nowrap text-muted">{{ row.original.phone || '—' }}</span>
          </template>
          <template #birthday-cell="{ row }">
            <span class="whitespace-nowrap text-muted">{{ formatDate(row.original.birthday) }}</span>
          </template>
          <template #beans-cell="{ row }">
            <UBadge
              color="primary"
              variant="subtle"
              icon="i-lucide-coins"
              :label="`${row.original.remainingBean ?? 0} / ${row.original.dailyLimitBean ?? 0}`"
            />
          </template>

          <template #actions-cell="{ row }">
            <div class="flex justify-end">
              <UButton
                icon="i-lucide-coins"
                color="neutral"
                variant="ghost"
                :aria-label="`Đổi giới hạn bean của ${row.original.username}`"
                class="transition duration-200 active:scale-95"
                @click="openBeanLimit(row.original)"
              />
            </div>
          </template>

          <!-- Empty state: differs for "no data" and "no search match" -->
          <template #empty>
            <div class="flex flex-col items-center gap-3 py-10 text-center">
              <UIcon name="i-lucide-users" class="size-10 text-dimmed" />
              <p class="text-sm text-muted">
                {{ keyword ? 'Không có người dùng nào khớp với tìm kiếm.' : 'Chưa có người dùng nào.' }}
              </p>
            </div>
          </template>
        </UTable>
      </ClientOnly>

      <!-- Pagination, only when more than one page -->
      <div v-if="total > pageSize" class="flex justify-end border-t border-default p-4">
        <UPagination v-model:page="page" :items-per-page="pageSize" :total="total" />
      </div>
    </UCard>
  </div>
</template>
