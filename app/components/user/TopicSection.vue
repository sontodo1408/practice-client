<script setup lang="ts">
import type { Question } from '~/types/question'
import type { SubjectSectionData } from '~/types/userSubject'

// One topic: a two-column table, "Must know" (easy/medium) and "Senior knowledge" (HARD), titles only
const props = defineProps<{ section: SubjectSectionData, subjectId: number }>()
// Asks the page to open the question dialog
const emit = defineEmits<{ open: [question: Question] }>()

const learnedStore = useLearnedStore()

// Split by difficulty; the order from the backend is kept
const mustKnow = computed(() => props.section.questions.filter(q => q.difficulty !== 'HARD'))
const senior = computed(() => props.section.questions.filter(q => q.difficulty === 'HARD'))

// Table columns, rendered with one loop
const columns = computed(() => [
  { key: 'must', label: 'Cần nắm vững', questions: mustKnow.value },
  { key: 'senior', label: 'Kiến thức Senior', questions: senior.value }
])
</script>

<template>
  <!-- The section id is the topic slug so the sidebar can jump here; scroll-mt clears the sticky header -->
  <section :id="section.id" class="scroll-mt-28">
    <h2 class="text-xl font-bold text-highlighted">{{ section.name }}</h2>
    <p v-if="section.description" class="mt-1 text-sm text-muted">{{ section.description }}</p>

    <div class="mt-3 grid overflow-hidden rounded-2xl border border-default bg-default md:grid-cols-2">
      <div
        v-for="(col, i) in columns"
        :key="col.key"
        class="min-w-0"
        :class="i > 0 ? 'border-t border-default md:border-t-0 md:border-l' : ''"
      >
        <h3 class="bg-brand-50 px-4 py-2 text-sm font-semibold text-primary dark:bg-brand-950/40">{{ col.label }}</h3>

        <ul v-if="col.questions.length" class="divide-y divide-default">
          <li
            v-for="q in col.questions"
            :key="q.id"
            class="flex items-start gap-3 px-4 py-2.5 transition-colors duration-200 hover:bg-elevated"
          >
            <!-- Tick when understood; saved to localStorage by the store -->
            <UCheckbox
              class="mt-0.5"
              :model-value="learnedStore.isLearned(subjectId, q.id)"
              :aria-label="`Đánh dấu đã hiểu: ${q.title}`"
              @update:model-value="learnedStore.setLearned(subjectId, q.id, $event === true)"
            />
            <!-- Title opens the practice dialog -->
            <button
              type="button"
              class="min-w-0 flex-1 text-left text-sm transition hover:text-primary"
              :class="learnedStore.isLearned(subjectId, q.id) ? 'text-muted line-through' : 'text-default'"
              @click="emit('open', q)"
            >
              {{ q.title }}
            </button>
          </li>
        </ul>
        <p v-else class="px-4 py-3 text-sm text-muted">Chưa có câu hỏi</p>
      </div>
    </div>
  </section>
</template>
