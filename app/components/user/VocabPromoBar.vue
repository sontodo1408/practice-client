<script setup lang="ts">
// Single-row promo strip linking to the vocabulary screen. Same width as the hero banner, one line tall.
// Used on the home screen under the hero.
</script>

<template>
  <!-- The whole strip is one link; arrow nudges right on hover, press feedback on click -->
  <NuxtLink
    to="/vocab-learning"
    class="group animate-fade-up relative flex items-center gap-3 overflow-hidden rounded-2xl border border-violet-200/70 bg-linear-to-r from-violet-50 via-white to-violet-100 px-4 py-2.5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-500/15 focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.99] sm:px-5 dark:border-violet-900/40 dark:from-violet-950 dark:via-neutral-900 dark:to-neutral-950"
  >
    <!-- Icon tile -->
    <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 transition duration-300 group-hover:scale-110 group-hover:bg-violet-500 group-hover:text-white dark:bg-violet-950 dark:text-violet-400">
      <UIcon name="i-lucide-languages" class="size-5" />
    </span>

    <!-- Single line of copy; truncated on narrow screens so the strip never wraps -->
    <p class="min-w-0 flex-1 truncate text-sm text-toned sm:text-base">
      <strong class="font-semibold text-highlighted">Học từ vựng</strong>
      <span class="hidden sm:inline"> — Ghi nhớ từ mới theo từng bộ từ vựng, học mọi lúc mọi nơi</span>
    </p>

    <!-- Call to action -->
    <span class="flex shrink-0 items-center gap-1 text-sm font-semibold text-violet-600 dark:text-violet-400">
      <span class="hidden sm:inline">Học ngay</span>
      <UIcon name="i-lucide-arrow-right" class="size-4 transition duration-300 group-hover:translate-x-1" />
    </span>
  </NuxtLink>
</template>
