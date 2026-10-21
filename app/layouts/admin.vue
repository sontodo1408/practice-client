<script setup lang="ts">
// Shared layout for all admin screens: top header + left sidebar + content area
const authStore = useAuthStore()
const { logout } = useAuth()

// Mobile sidebar (slideover) visibility; the desktop sidebar is always shown
const mobileNavOpen = ref(false)
// Close the slideover whenever the route changes
watch(() => useRoute().fullPath, () => { mobileNavOpen.value = false })

// Prefer the full name, fall back to the username
const userLabel = computed(() => {
  const user = authStore.user
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  return fullName || user?.username || 'Admin'
})

// Account menu in the header
const userMenu = computed(() => [
  [{ label: userLabel.value, type: 'label' as const }],
  [{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      // Logout failures are shown by the global dialog; stay on the page in that case
      try {
        await logout()
      } catch (e) {
        if (!(e instanceof ApiError)) throw e
        return
      }
      await navigateTo('/login')
    }
  }]
])
</script>

<template>
  <div class="min-h-dvh bg-brand-50/60 dark:bg-neutral-950">
    <!-- Fixed sidebar, desktop only -->
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-default bg-default lg:block">
      <AdminSidebar />
    </aside>

    <!-- Mobile sidebar -->
    <USlideover
      v-model:open="mobileNavOpen"
      side="left"
      title="Navigation"
      description="Admin navigation menu"
      :ui="{ content: 'max-w-64', header: 'sr-only' }"
    >
      <template #body>
        <AdminSidebar class="-m-4 sm:-m-6" @navigate="mobileNavOpen = false" />
      </template>
    </USlideover>

    <div class="lg:pl-64">
      <!-- Sticky header with blur so content scrolls underneath -->
      <header class="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-default bg-default/80 px-4 backdrop-blur sm:px-6">
        <UButton
          class="lg:hidden"
          icon="i-lucide-menu"
          color="neutral"
          variant="ghost"
          aria-label="Open navigation"
          @click="mobileNavOpen = true"
        />
        <div class="flex-1" />
        <UColorModeButton />
        <UDropdownMenu :items="userMenu" :content="{ align: 'end' }">
          <UButton color="neutral" variant="ghost" trailing-icon="i-lucide-chevron-down" class="transition duration-200 active:scale-95">
            <UAvatar :alt="userLabel" size="xs" />
            <span class="hidden max-w-40 truncate sm:inline">{{ userLabel }}</span>
          </UButton>
        </UDropdownMenu>
      </header>

      <!-- Page content -->
      <main class="mx-auto w-full max-w-6xl p-4 sm:p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
