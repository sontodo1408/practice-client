<script setup lang="ts">
import type { UserSubject } from '~/types/userSubject'

// Subject block with a 16:9 media area and a per-subject accent color; shows a progress bar when the subject is being studied
const props = defineProps<{ subject: UserSubject }>()

// Accent colors and icon come from the shared util so the subject page hero matches this card
const accent = computed(() => subjectAccent(props.subject.id))
</script>

<template>
  <!-- Whole card is a link to the subject; lift + colored glow on hover, press feedback on click.
       Every card has the same 16:9 media area on top, so heights match whether or not there is an image. -->
  <NuxtLink
    :to="`/subject/${subject.slug}`"
    :class="accent.card"
    class="group relative flex flex-col overflow-hidden rounded-2xl border border-default bg-default transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-primary active:scale-95"
  >
    <!-- 16:9 media area; overflow-hidden keeps the hover zoom inside the image box -->
    <div class="relative aspect-video w-full shrink-0 overflow-hidden">
      <!-- Banner image when the subject has one -->
      <img
        v-if="subject.imgBanner"
        :src="imgUrl(subject.imgBanner)"
        :alt="subject.name"
        loading="lazy"
        class="size-full object-cover transition duration-500 group-hover:scale-105"
      >
      <!-- No image: soft accent gradient with the icon tile centered; the tile fills and scales on hover -->
      <div v-else :class="accent.hero" class="flex size-full items-center justify-center bg-linear-to-br">
        <span :class="accent.tile" class="flex size-12 items-center justify-center rounded-xl transition duration-300 group-hover:scale-110 group-hover:text-white sm:size-14">
          <UIcon :name="subjectIcon(subject.id)" class="size-6 sm:size-7" />
        </span>
      </div>
      <!-- Arrow slides in at the top-right corner on hover -->
      <span class="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-default/90 opacity-0 shadow-sm transition duration-300 group-hover:opacity-100">
        <UIcon name="i-lucide-arrow-up-right" :class="accent.arrow" class="size-4 -translate-x-0.5 translate-y-0.5 transition duration-300 group-hover:translate-x-0 group-hover:translate-y-0" />
      </span>
    </div>

    <div class="min-w-0 shrink-0 px-4 py-2.5 sm:px-5 sm:py-3">
      <h3 class="truncate text-base font-semibold text-highlighted sm:text-lg">{{ subject.name }}</h3>
      <!-- Always reserve two lines (min-h = 2 x line height) so cards line up; longer text is cut with an ellipsis -->
      <p class="line-clamp-2 min-h-8 text-xs text-muted sm:min-h-10 sm:text-sm">{{ subject.description }}</p>

      <!-- Linear progress for studied subjects, counts otherwise -->
      <div v-if="subject.progress !== undefined" class="mt-3">
        <UProgress :model-value="subject.progress" size="xs" />
        <!-- Percentage in a strong text color so it stays readable on the card background -->
        <span class="mt-1 block text-xs text-toned"><strong class="font-semibold text-highlighted">{{ subject.progress }}%</strong> hoàn thành</span>
      </div>
      <div v-else class="mt-3 flex flex-wrap gap-1">
        <UBadge :label="`${subject.topicCount} chủ đề`" color="neutral" variant="subtle" size="sm" />
        <UBadge :label="`${subject.questionCount} câu hỏi`" color="neutral" variant="subtle" size="sm" />
      </div>
    </div>
  </NuxtLink>
</template>
