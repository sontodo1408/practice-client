<script setup lang="ts">
// Home hero: gradient banner with floating blobs, headline, call to action and quick stats.
// Only used on the home screen.
const props = withDefaults(defineProps<{
  // Signed-in user's display name; shows a greeting chip when set
  userName?: string
  // Catalog numbers for the stats row; the row is hidden while they are all zero (loading / empty)
  subjectCount?: number
  topicCount?: number
  questionCount?: number
}>(), {
  userName: '',
  subjectCount: 0,
  topicCount: 0,
  questionCount: 0
})

// Stats shown under the buttons; built from props so the template stays a simple loop
const stats = computed(() => [
  { icon: 'i-lucide-book-open', value: props.subjectCount, label: 'Môn học' },
  { icon: 'i-lucide-list-tree', value: props.topicCount, label: 'Chủ đề' },
  { icon: 'i-lucide-circle-help', value: props.questionCount, label: 'Câu hỏi' }
])
const hasStats = computed(() => stats.value.some(s => s.value > 0))

// Smoothly scroll to the subject list (anchor id is set on the home page)
function scrollToSubjects() {
  document.getElementById('subjects')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <!-- Compact banner with a soft brand-tinted gradient: noticeable but light and elegant -->
  <section class="relative isolate overflow-hidden rounded-3xl border border-brand-200/70 bg-linear-to-br from-brand-50 via-brand-100 to-brand-200/80 px-5 py-7 text-center sm:px-12 sm:py-10 dark:border-brand-900/40 dark:from-brand-950 dark:via-neutral-900 dark:to-neutral-950">
    <!-- Decorative blobs: slow floating motion, purely visual -->
    <div class="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      <div class="animate-float-slow absolute -top-20 -left-16 size-64 rounded-full bg-brand-300/40 blur-3xl dark:bg-brand-700/25" />
      <div class="animate-float-slow absolute -right-16 -bottom-24 size-72 rounded-full bg-brand-300/50 blur-3xl [animation-delay:2s] dark:bg-brand-600/20" />
    </div>

    <!-- Greeting chip for signed-in users -->
    <div v-if="userName" class="animate-fade-up mb-3 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/70 px-3 py-1 text-sm text-brand-700 backdrop-blur dark:border-brand-800 dark:bg-white/5 dark:text-brand-300">
      <UIcon name="i-lucide-hand" class="size-4" />
      <span>Chào mừng trở lại, <strong class="font-semibold">{{ userName }}</strong></span>
    </div>

    <!-- The h1 keeps the SEO keywords ("câu hỏi phỏng vấn") -->
    <h1 class="animate-fade-up mx-auto max-w-3xl text-2xl leading-tight font-extrabold tracking-tight text-highlighted [--index:1] sm:text-4xl">
      Luyện câu hỏi phỏng vấn lập trình
      <span class="bg-linear-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">chấm điểm bằng AI</span>
    </h1>
    <p class="animate-fade-up mx-auto mt-2 max-w-xl text-sm text-muted [--index:2] sm:text-base">
      Chọn một bộ câu hỏi theo công nghệ, xem đáp án chi tiết và nhận nhận xét cho câu trả lời của bạn.
    </p>

    <!-- Call to action + stats on one row to keep the banner short -->
    <div class="animate-fade-up mt-5 flex flex-col items-center gap-4 [--index:3] sm:flex-row sm:justify-center sm:gap-6">
      <UButton
        size="lg"
        trailing-icon="i-lucide-arrow-down"
        class="rounded-full px-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:scale-95"
        @click="scrollToSubjects"
      >
        Bắt đầu luyện tập
      </UButton>

      <!-- Quick stats as small pills; appear once the catalog is loaded -->
      <dl v-if="hasStats" class="flex flex-wrap justify-center gap-2">
        <div v-for="s in stats" :key="s.label" class="flex items-center gap-1.5 rounded-full border border-white/70 bg-white/60 px-3 py-1.5 text-sm backdrop-blur dark:border-white/10 dark:bg-white/5">
          <UIcon :name="s.icon" class="size-4 text-primary" />
          <dt class="sr-only">{{ s.label }}</dt>
          <dd class="font-bold text-highlighted">{{ s.value.toLocaleString('vi-VN') }}</dd>
          <span class="text-muted" aria-hidden="true">{{ s.label }}</span>
        </div>
      </dl>
    </div>
  </section>
</template>
