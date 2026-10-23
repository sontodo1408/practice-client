<script setup lang="ts">
import type { UserSubject } from '~/types/userSubject'

// Square subject block; shows a progress bar when the subject is being studied
defineProps<{ subject: UserSubject }>()

// The backend has no icon field, so pick a stable decorative icon from the subject id
const ICONS = [
  'i-lucide-calculator',
  'i-lucide-atom',
  'i-lucide-flask-conical',
  'i-lucide-dna',
  'i-lucide-languages',
  'i-lucide-landmark',
  'i-lucide-globe',
  'i-lucide-code'
]
</script>

<template>
  <!-- Whole card is a link to the subject; lift + glow on hover, press feedback on click -->
  <NuxtLink
    :to="`/subject/${subject.slug}`"
    :class="subject.imgBanner ? '' : 'aspect-square justify-between'"
    class="group flex flex-col rounded-2xl border border-default overflow-hidden bg-default transition duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-xl hover:shadow-primary/10 focus-visible:outline-2 focus-visible:outline-primary active:scale-95"
  >
    <!-- Banner image when the subject has one: full-bleed, no padding (the card clips it to the rounded corners) -->
    <img
      v-if="subject.imgBanner"
      :src="imgUrl(subject.imgBanner)"
      :alt="subject.name"
      loading="lazy"
      class="aspect-video w-full shrink-0 object-cover"
    >
    <!-- Icon tile fallback, scales and fills with brand color on hover -->
    <span v-else class="mx-4 mt-4 flex size-11 shrink-0 sm:mx-5 sm:mt-5 items-center justify-center rounded-xl bg-brand-100 text-primary transition duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-white dark:bg-brand-950">
      <UIcon :name="ICONS[subject.id % ICONS.length]" class="size-6" />
    </span>

    <div class="min-w-0 shrink-0 px-4 py-2.5 sm:px-5 sm:py-3">
      <h3 class="truncate text-base font-semibold text-highlighted sm:text-lg">{{ subject.name }}</h3>
      <p class="line-clamp-2 text-xs text-muted sm:text-sm">{{ subject.description }}</p>

      <!-- Progress for studied subjects, topic count otherwise -->
      <div v-if="subject.progress !== undefined" class="mt-3">
        <UProgress :model-value="subject.progress" size="xs" />
        <span class="mt-1 block text-xs text-muted">{{ subject.progress }}% completed</span>
      </div>
      <div v-else class="mt-3 flex flex-wrap gap-1">
        <UBadge :label="`${subject.topicCount} chủ đề`" color="neutral" variant="subtle" size="sm" />
        <UBadge :label="`${subject.questionCount} câu hỏi`" color="neutral" variant="subtle" size="sm" />
      </div>
    </div>
  </NuxtLink>
</template>
