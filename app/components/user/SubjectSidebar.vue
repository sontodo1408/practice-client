<script setup lang="ts">
import type { SubjectSectionData, UserSubject } from '~/types/userSubject'

// Left panel of the subject page: the topic list (jump links). Subject info and progress live in SubjectHero.
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

</script>

<template>
  <div class="rounded-2xl border border-default bg-default p-4">
    <!-- Topic list; the active one is highlighted -->
    <nav aria-label="Chủ đề">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Chủ đề</p>
      <ul class="space-y-1 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto">
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
