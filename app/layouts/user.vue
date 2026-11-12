<script setup lang="ts">
// Public layout: header + centered content. No sign-in required to view.
// The signed-in user is restored globally by plugins/auth.ts, so nothing is loaded here.
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
