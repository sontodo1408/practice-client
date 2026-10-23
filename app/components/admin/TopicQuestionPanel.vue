<script setup lang="ts">
import type { Question, TopicQuestion } from '~/types/question'

// Expandable topic card: header (toggle + question count) and, when open, one block per question
// with edit/delete actions.
defineProps<{ topic: TopicQuestion }>()
const emit = defineEmits<{
  edit: [question: Question]
  remove: [question: Question]
}>()

const open = ref(false)

// Badge color per difficulty
const difficultyColor = {
  EASY: 'success',
  MEDIUM: 'warning',
  HARD: 'error'
} as const
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }" class="overflow-hidden transition duration-200 hover:shadow-md">
    <!-- Header: whole row toggles the panel -->
    <button
      type="button"
      class="flex w-full items-center gap-3 p-3 text-left focus-visible:outline-2 focus-visible:outline-primary sm:p-4"
      :aria-expanded="open"
      @click="open = !open"
    >
      <UIcon
        name="i-lucide-chevron-right"
        class="size-5 shrink-0 text-muted transition-transform duration-300"
        :class="{ 'rotate-90': open }"
      />
      <span class="min-w-0 flex-1">
        <span class="block truncate font-semibold text-highlighted">{{ topic.topicName }}</span>
        <span v-if="topic.description" class="block truncate text-sm text-muted">{{ topic.description }}</span>
      </span>
      <UBadge
        color="neutral"
        variant="subtle"
        :label="`${topic.questions.length} câu hỏi`"
      />
    </button>

    <!-- Collapsible body: animates height via grid rows (0fr -> 1fr) -->
    <div class="grid transition-[grid-template-rows] duration-300 ease-out" :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
      <div class="overflow-hidden" :inert="!open">
        <ul v-if="topic.questions.length" class="space-y-3 border-t border-default bg-elevated/40 p-3 sm:p-4">
          <!-- Question block -->
          <li
            v-for="q in topic.questions"
            :key="q.id"
            class="rounded-lg border border-default bg-default p-3 transition duration-200 hover:border-primary/50 hover:shadow-sm sm:p-4"
          >
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-medium text-highlighted">{{ q.title }}</p>
                  <UBadge :color="difficultyColor[q.difficulty] ?? 'neutral'" variant="subtle" size="sm" :label="q.difficulty" />
                </div>
                <p class="mt-1 whitespace-pre-line text-sm text-default">{{ q.question }}</p>
                <!-- Answer in a muted box so it reads as secondary content -->
                <div v-if="q.answer" class="mt-2 rounded-md bg-elevated px-3 py-2 text-sm text-muted">
                  <span class="font-medium text-highlighted">Đáp án: </span>
                  <span class="whitespace-pre-line">{{ q.answer }}</span>
                </div>
              </div>
              <UButton
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                :aria-label="`Sửa ${q.title}`"
                class="transition duration-200 active:scale-95"
                @click="emit('edit', q)"
              />
              <UButton
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                :aria-label="`Xóa ${q.title}`"
                class="transition duration-200 active:scale-95"
                @click="emit('remove', q)"
              />
            </div>
          </li>
        </ul>

        <!-- Empty state for a topic without questions -->
        <p v-else class="border-t border-default px-4 py-6 text-center text-sm text-muted">
          Chủ đề này chưa có câu hỏi nào.
        </p>
      </div>
    </div>
  </UCard>
</template>
