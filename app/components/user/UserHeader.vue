<script setup lang="ts">
// Public header: logo, centered search, theme toggle and account area (login button or user menu)
const authStore = useAuthStore()
const { logout } = useAuth()
const route = useRoute()

// Search text mirrors ?q= so the home screen can filter; typing navigates to / (debounced)
const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
watch(() => route.query.q, (q) => { search.value = typeof q === 'string' ? q : '' })
let timer: ReturnType<typeof setTimeout> | undefined
function onSearch() {
  clearTimeout(timer)
  timer = setTimeout(() => {
    navigateTo({ path: '/', query: search.value.trim() ? { q: search.value.trim() } : {} }, { replace: true })
  }, 250)
}
function clearSearch() {
  search.value = ''
  onSearch()
}
onBeforeUnmount(() => clearTimeout(timer))

// Prefer the full name, fall back to the username
const userLabel = computed(() => {
  const user = authStore.user
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.username || 'Người dùng'
})

// Account dropdown; admin entry only for admins
const userMenu = computed(() => [
  [{ label: userLabel.value, type: 'label' as const }],
  [
    ...(authStore.isAdmin ? [{ label: 'Admin', icon: 'i-lucide-shield', to: '/admin/subject' }] : []),
    {
      label: 'Đăng xuất',
      icon: 'i-lucide-log-out',
      onSelect: async () => {
        // Failures are shown by the global dialog
        try {
          await logout()
        } catch (e) {
          if (!(e instanceof ApiError)) throw e
        }
      }
    }
  ]
])
</script>

<template>
  <!-- Sticky blurred header so content scrolls underneath -->
  <header class="sticky top-0 z-20 border-b border-default bg-default/80 backdrop-blur">
    <!-- Full width like the admin header; only the page content below is centered -->
    <div class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 sm:flex-nowrap sm:gap-4 sm:px-6">
      <!-- Logo / brand -->
      <NuxtLink to="/" class="flex shrink-0 items-center gap-2 transition active:scale-95">
        <img src="/logo.png" alt="Practice" class="size-8 rounded-lg">
        <span class="hidden text-lg font-bold text-highlighted sm:inline">Practice</span>
      </NuxtLink>

      <!-- Search: own row on mobile (order-last), centered on larger screens -->
      <form class="order-last w-full sm:order-none sm:mx-auto sm:max-w-md sm:flex-1" role="search" @submit.prevent="onSearch">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Tìm môn học..."
          size="lg"
          class="w-full"
          aria-label="Tìm môn học"
          @update:model-value="onSearch"
        >
          <!-- Clear button appears only when there is text -->
          <template v-if="search" #trailing>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="link"
              size="xs"
              aria-label="Xóa tìm kiếm"
              @click="clearSearch"
            />
          </template>
        </UInput>
      </form>

      <div class="ml-auto flex shrink-0 items-center gap-1 sm:ml-0 sm:gap-2">
        <UColorModeButton />

        <!-- Signed in: avatar menu -->
        <UDropdownMenu v-if="authStore.isLoggedIn" :items="userMenu" :content="{ align: 'end' }">
          <UButton color="neutral" variant="ghost" class="gap-2 active:scale-95">
            <UAvatar :src="authStore.user?.avatarUrl ?? undefined" :alt="userLabel" size="xs" />
            <span class="hidden max-w-32 truncate sm:inline">{{ userLabel }}</span>
            <UIcon name="i-lucide-chevron-down" class="size-4 text-muted" />
          </UButton>
        </UDropdownMenu>

        <!-- Signed out: login button that returns here afterwards -->
        <UButton v-else :to="loginLocation(route.fullPath)" icon="i-lucide-log-in" class="active:scale-95">
          Đăng nhập
        </UButton>
      </div>
    </div>
  </header>
</template>
