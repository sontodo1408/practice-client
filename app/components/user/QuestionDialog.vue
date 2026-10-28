<script setup lang="ts">
import type { Question } from '~/types/question'

// Dialog to practice one question: read it, type an answer, reveal the model answer with the lightbulb
// subjectName/subjectDescription are optional context sent along with the AI check
const props = defineProps<{
  question: Question | null
  subjectName?: string
  subjectDescription?: string | null
}>()
const open = defineModel<boolean>('open', { default: false })

const learnedStore = useLearnedStore()
const aiApi = useAiApi()

// The learner's draft answer and whether the hint (model answer) is visible
const draft = ref('')
const showHint = ref(false)
// AI check state: loading flag and the feedback text returned by the backend
const checking = ref(false)
const feedback = ref<string | null>(null)

// The backend returns the whole review at once, so it is revealed progressively to look like streaming
let typingTimer: ReturnType<typeof setInterval> | null = null
// Full review text while it is being revealed, and whether the reveal has finished
let fullText = ''
const typingDone = ref(true)

// Cancel the timer without touching the text
function clearTimer() {
  if (typingTimer) {
    clearInterval(typingTimer)
    typingTimer = null
  }
}

// Stop the animation and show the complete text, so an interrupted reveal never leaves a truncated review
function finishTyping() {
  if (typingDone.value) return
  clearTimer()
  feedback.value = fullText
  typingDone.value = true
}

// Reveal `text` in small chunks; the chunk size grows with the length so long reviews still finish in ~3s
function typeOut(text: string) {
  clearTimer()
  fullText = text
  // Users who prefer reduced motion get the full text immediately
  if (import.meta.client && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    feedback.value = text
    typingDone.value = true
    return
  }
  const step = Math.max(2, Math.ceil(text.length / 150))
  let shown = 0
  feedback.value = ''
  typingDone.value = false
  typingTimer = setInterval(() => {
    shown = Math.min(text.length, shown + step)
    feedback.value = text.slice(0, shown)
    if (shown >= text.length) finishTyping()
  }, 20)
}

// Start fresh whenever another question is opened
watch(() => props.question?.id, () => {
  clearTimer()
  typingDone.value = true
  draft.value = ''
  showHint.value = false
  feedback.value = null
})

// Closing the dialog mid-animation completes the text; the timer is also cleared on destroy
watch(open, (value) => {
  if (!value) finishTyping()
})
onBeforeUnmount(clearTimer)

// Send the learner's answer to the AI and show the result inside the dialog
async function check() {
  if (!props.question || checking.value) return
  checking.value = true
  try {
    clearTimer()
    typingDone.value = true
    feedback.value = null
    const result = await aiApi.review({
      subjectName: props.subjectName ?? '',
      subjectDescription: props.subjectDescription ?? '',
      question: props.question.question,
      answer: draft.value
    })
    typeOut(result)
  } catch {
    // useApi already displayed the error dialog
  } finally {
    checking.value = false
  }
}

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

        <!-- AI feedback fades in once the check returns -->
        <Transition
          enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
          enter-from-class="-translate-y-2 opacity-0"
          leave-active-class="transition duration-200 ease-in motion-reduce:transition-none"
          leave-to-class="-translate-y-2 opacity-0"
        >
          <div v-if="feedback !== null" class="rounded-xl border border-default bg-elevated p-4">
            <p class="mb-1 flex items-center gap-1 text-sm font-semibold text-primary">
              <UIcon name="i-lucide-sparkles" class="size-4" /> Kết quả review
            </p>
            <!-- The AI replies in Markdown (bold, lists, code...); MDC renders it with Nuxt UI prose styles -->
            <!-- The key remounts MDC once for the complete text: MDC parses asynchronously, so a fresh parse
                 guarantees the final render is never a stale partial result from the animation -->
            <MDC :key="typingDone ? 'final' : 'live'" :value="feedback" tag="div" class="text-sm text-default" />
          </div>
        </Transition>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UButton
            :icon="showHint ? 'i-lucide-lightbulb-off' : 'i-lucide-lightbulb'"
            :label="showHint ? 'Ẩn gợi ý' : 'Hiện gợi ý'"
            color="primary"
            variant="soft"
            class="active:scale-95"
            @click="showHint = !showHint"
          />
          <!-- Disabled until the learner typed something to check -->
          <UButton
            icon="i-lucide-sparkles"
            label="Kiểm tra"
            color="primary"
            :loading="checking"
            :disabled="!draft.trim()"
            class="active:scale-95"
            @click="check"
          />
        </div>
        <UCheckbox v-model="learned" label="Tôi đã hiểu câu này" />
      </div>
    </template>
  </UModal>
</template>
