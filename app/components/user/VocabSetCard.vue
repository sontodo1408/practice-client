<script setup lang="ts">
import type { VocabSet } from '~/types/vocab'

// Vocabulary set block: 16:9 media area (banner or accent gradient), name, description and word count.
// Mirrors SubjectCard so both screens look alike; the accent comes from the set id.
const props = defineProps<{ set: VocabSet }>()

const accent = computed(() => subjectAccent(props.set.id))
</script>

<template>
  <!-- Whole card links to the set; lift + colored glow on hover, press feedback on click -->
  <NuxtLink
    :to="`/vocab-learning/${set.slug}`"
    :class="accent.card"
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-default bg-default transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-primary active:scale-95"
  >
    <!-- 16:9 media area; overflow-hidden keeps the hover zoom inside the image box -->
    <div class="relative aspect-video w-full shrink-0 overflow-hidden">
      <img
        v-if="set.imgBanner"
        :src="imgUrl(set.imgBanner)"
        :alt="set.name"
        loading="lazy"
        class="size-full object-cover transition duration-500 group-hover:scale-105"
      >
      <!-- No image: soft accent gradient with a centered icon tile -->
      <div v-else :class="accent.hero" class="flex size-full items-center justify-center bg-linear-to-br">
        <span :class="accent.tile" class="flex size-12 items-center justify-center rounded-xl transition duration-300 group-hover:scale-110 group-hover:text-white sm:size-14">
          <UIcon name="i-lucide-languages" class="size-6 sm:size-7" />
        </span>
      </div>
    </div>

    <div class="min-w-0 shrink-0 px-4 py-2.5 sm:px-5 sm:py-3">
      <h3 class="truncate text-base font-semibold text-highlighted sm:text-lg">{{ set.name }}</h3>
      <!-- Reserve two lines so cards line up -->
      <p class="line-clamp-2 min-h-8 text-xs text-muted sm:min-h-10 sm:text-sm">{{ set.description }}</p>
      <div class="mt-3 flex flex-wrap gap-1">
        <UBadge :label="`${set.wordNum ?? 0} từ vựng`" color="neutral" variant="subtle" size="sm" />
      </div>
    </div>
  </NuxtLink>
</template>
