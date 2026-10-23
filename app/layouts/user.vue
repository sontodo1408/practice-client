<script setup lang="ts">
// Public layout: header + centered content. No sign-in required to view.
// Restore the user from the token cookie once on the client so the header shows the account state.
const authStore = useAuthStore()
onMounted(() => {
  if (!authStore.isLoggedIn) useAuth().fetchMe()
})
</script>

<template>
  <div class="min-h-dvh bg-brand-50/60 dark:bg-neutral-950">
    <UserHeader />
    <!-- Content is centered with a max width -->
    <main class="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <slot />
    </main>
  </div>
</template>
