<script setup lang="ts">
import type { SubjectSectionData, UserSubject } from '~/types/userSubject'

// Left panel of the subject page: subject info, overall progress and the topic list (jump links)
const props = defineProps<{
  subject: UserSubject
  sections: SubjectSectionData[]
  // Slug of the topic currently in view
  activeId: string
}>()
const emit = defineEmits<{ select: [id: string] }>()

const learnedStore = useLearnedStore()

// Learned question count for a list of questions
const countLearned = (section: SubjectSectionData) =>
  section.questions.filter(q => learnedStore.isLearned(props.subject.id, q.id)).length

const totalQuestions = computed(() => props.sections.reduce((n, s) => n + s.questions.length, 0))
const totalLearned = computed(() => props.sections.reduce((n, s) => n + countLearned(s), 0))
const percent = computed(() => (totalQuestions.value ? Math.round((totalLearned.value / totalQuestions.value) * 100) : 0))
</script>

<template>
  <div class="rounded-2xl border border-default bg-default p-4">
    <!-- Subject info -->
    <h1 class="text-xl font-bold text-highlighted">{{ subject.name }}</h1>
    <p v-if="subject.description" class="mt-1 text-sm text-muted">{{ subject.description }}</p>
    <div class="mt-3 flex flex-wrap gap-1">
      <UBadge :label="`${subject.topicCount} chủ đề`" color="neutral" variant="subtle" size="sm" />
      <UBadge :label="`${subject.questionCount} câu hỏi`" color="neutral" variant="subtle" size="sm" />
    </div>

    <!-- Overall progress from the localStorage ticks -->
    <div class="mt-4">
      <UProgress :model-value="percent" size="sm" />
      <span class="mt-1 block text-xs text-muted">{{ totalLearned }} / {{ totalQuestions }} đã hiểu</span>
    </div>

    <!-- Topic list; the active one is highlighted -->
    <nav class="mt-4 border-t border-default pt-3" aria-label="Chủ đề">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Chủ đề</p>
      <ul class="space-y-1 lg:max-h-[calc(100dvh-24rem)] lg:overflow-y-auto">
        <li v-for="s in sections" :key="s.id">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition duration-200 active:scale-[0.98]"
            :class="activeId === s.id ? 'bg-brand-100 font-medium text-primary dark:bg-brand-950' : 'text-default hover:bg-elevated'"
            @click="emit('select', s.id)"
          >
            <span class="truncate">{{ s.name }}</span>
            <span class="shrink-0 text-xs text-muted">{{ countLearned(s) }}/{{ s.questions.length }}</span>
          </button>
        </li>
      </ul>
    </nav>
  </div>
</template>
