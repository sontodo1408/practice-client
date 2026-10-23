<script setup lang="ts">
import type { Question } from '~/types/question'

// Dialog to practice one question: read it, type an answer, reveal the model answer with the lightbulb
const props = defineProps<{ question: Question | null }>()
const open = defineModel<boolean>('open', { default: false })

const learnedStore = useLearnedStore()

// The learner's draft answer (local only) and whether the hint (model answer) is visible
const draft = ref('')
const showHint = ref(false)

// Start fresh whenever another question is opened
watch(() => props.question?.id, () => {
  draft.value = ''
  showHint.value = false
})

// Checkbox state mirrors the persisted store
const learned = computed({
  get: () => (props.question ? learnedStore.isLearned(props.question.subjectId, props.question.id) : false),
  set: (value: boolean) => {
    if (props.question) learnedStore.setLearned(props.question.subjectId, props.question.id, value)
  }
})
</script>

<template>
  <UModal v-model:open="open" :title="question?.title" description="Câu hỏi luyện tập" :ui="{ content: 'max-w-2xl' }">
    <template #body>
      <div v-if="question" class="space-y-4">
        <!-- Full question text -->
        <p class="whitespace-pre-wrap text-highlighted">{{ question.question }}</p>

        <!-- Free-text answer box; nothing is sent anywhere -->
        <UTextarea v-model="draft" :rows="6" autoresize placeholder="Nhập câu trả lời của bạn..." class="w-full" />

        <!-- Hint (model answer) slides in when the lightbulb is toggled -->
        <Transition
          enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
          enter-from-class="-translate-y-2 opacity-0"
          leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
          leave-to-class="-translate-y-2 opacity-0"
        >
          <div v-if="showHint" class="rounded-xl border border-primary/30 bg-brand-50 p-4 dark:bg-brand-950/40">
            <p class="mb-1 flex items-center gap-1 text-sm font-semibold text-primary">
              <UIcon name="i-lucide-lightbulb" class="size-4" /> Đáp án
            </p>
            <p class="whitespace-pre-wrap text-sm text-default">{{ question.answer }}</p>
          </div>
        </Transition>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-3">
        <UButton
          :icon="showHint ? 'i-lucide-lightbulb-off' : 'i-lucide-lightbulb'"
          :label="showHint ? 'Ẩn gợi ý' : 'Hiện gợi ý'"
          color="primary"
          variant="soft"
          class="active:scale-95"
          @click="showHint = !showHint"
        />
        <UCheckbox v-model="learned" label="Tôi đã hiểu câu này" />
      </div>
    </template>
  </UModal>
</template>
