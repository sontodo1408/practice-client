<script setup lang="ts">
import type { SubjectSectionData, UserSubject } from '~/types/userSubject'

// Banner at the top of the subject page: subject info in the subject's accent color, overall progress ring
// and a button that jumps to the next question to study. Only used on the subject page.
const props = defineProps<{
  subject: UserSubject
  sections: SubjectSectionData[]
}>()

const learnedStore = useLearnedStore()
const accent = computed(() => subjectAccent(props.subject.id))

// Progress from the localStorage ticks
const allQuestions = computed(() => props.sections.flatMap(s => s.questions))
const totalLearned = computed(() => allQuestions.value.filter(q => learnedStore.isLearned(props.subject.id, q.id)).length)
const percent = computed(() => (allQuestions.value.length ? Math.round((totalLearned.value / allQuestions.value.length) * 100) : 0))

// Next question to study: the first one not ticked yet, or the first one when everything is done / nothing started
const nextQuestion = computed(() =>
  allQuestions.value.find(q => !learnedStore.isLearned(props.subject.id, q.id)) ?? allQuestions.value[0]
)
const ctaLabel = computed(() => {
  if (totalLearned.value === 0) return 'Bắt đầu học'
  return totalLearned.value >= allQuestions.value.length ? 'Ôn tập lại' : 'Tiếp tục học'
})
</script>

<template>
  <section
    :class="accent.hero"
    class="relative isolate overflow-hidden rounded-3xl border bg-linear-to-br px-5 py-6 sm:px-8 sm:py-8"
  >
    <!-- Decorative blobs in the subject color -->
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div :class="accent.blobA" class="animate-float-slow absolute -top-16 -left-12 size-56 rounded-full blur-3xl" />
      <div :class="accent.blobB" class="animate-float-slow absolute -right-12 -bottom-20 size-64 rounded-full blur-3xl [animation-delay:2s]" />
    </div>

    <div class="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
      <!-- Icon tile -->
      <span :class="accent.tile" class="flex size-14 shrink-0 items-center justify-center rounded-2xl sm:size-16">
        <UIcon :name="subjectIcon(subject.id)" class="size-8" />
      </span>

      <!-- Title, description and counts -->
      <div class="min-w-0 flex-1">
        <h1 class="animate-fade-up text-2xl font-extrabold tracking-tight text-highlighted sm:text-3xl">{{ subject.name }}</h1>
        <p v-if="subject.description" class="animate-fade-up mt-1 line-clamp-3 text-sm text-muted [--index:1] sm:text-base">{{ subject.description }}</p>
        <div class="animate-fade-up mt-3 flex flex-wrap gap-1.5 [--index:2]">
          <UBadge :label="`${subject.topicCount} chủ đề`" color="neutral" variant="subtle" size="md" />
          <UBadge :label="`${subject.questionCount} câu hỏi`" color="neutral" variant="subtle" size="md" />
        </div>
      </div>

      <!-- Progress ring (pathLength=100 so the dash array is the percentage) + call to action -->
      <div class="animate-fade-up flex items-center gap-4 [--index:3] sm:flex-col sm:gap-3">
        <div class="relative size-20 shrink-0">
          <svg viewBox="0 0 36 36" class="size-full -rotate-90" role="img" :aria-label="`${percent}%`">
            <circle cx="18" cy="18" r="15.9155" fill="none" pathLength="100" class="stroke-neutral-200 dark:stroke-neutral-700" stroke-width="3.5" />
            <circle
              cx="18" cy="18" r="15.9155" fill="none" pathLength="100" stroke-width="3.5" stroke-linecap="round"
              :class="accent.ring"
              :stroke-dasharray="`${percent} 100`"
              class="transition-all duration-700"
            />
          </svg>
          <span class="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span class="text-lg font-bold text-highlighted">{{ percent }}%</span>
            <span class="mt-0.5 text-[10px] text-muted">{{ totalLearned }}/{{ allQuestions.length }}</span>
          </span>
        </div>

        <!-- Plain link styled as a button so the button hue follows the subject accent -->
        <NuxtLink
          v-if="nextQuestion"
          :to="`/subject/${subject.slug}/${questionSlug(nextQuestion)}`"
          :class="accent.btn"
          class="inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-95"
        >
          {{ ctaLabel }}
          <UIcon name="i-lucide-arrow-right" class="size-4" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
