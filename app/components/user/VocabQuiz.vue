<script setup lang="ts">
import type { VocabWord } from '~/types/vocab'

// Study mode: multiple choice. The prompt is the word and the 4 answers are meanings (1 correct, 3 taken from
// other words of the set). "Reverse" shows the meaning as the prompt and the words as answers.
const props = defineProps<{ words: VocabWord[] }>()

interface Question {
  word: VocabWord
  // Answer texts in display order, and the correct one
  options: string[]
  answer: string
}

const reversed = ref(false)
const questions = ref<Question[]>([])
const index = ref(0)
const score = ref(0)
// Option the user picked for the current question; null until answered
const picked = ref<string | null>(null)
const finished = ref(false)

// Text shown as the prompt / as an answer, depending on the direction
const promptOf = (w: VocabWord) => (reversed.value ? w.meaning : w.word)
const answerOf = (w: VocabWord) => (reversed.value ? w.word : w.meaning)

// Build a fresh shuffled round; distractors come from other words and never repeat the correct answer
function buildQuestions(): Question[] {
  return shuffle(props.words).map((word) => {
    const answer = answerOf(word)
    const pool = [...new Set(props.words.filter(w => w.id !== word.id).map(answerOf))].filter(t => t !== answer)
    return { word, answer, options: shuffle([answer, ...shuffle(pool).slice(0, 3)]) }
  })
}

function start() {
  questions.value = buildQuestions()
  index.value = 0
  score.value = 0
  picked.value = null
  finished.value = false
}
function toggleReverse() {
  reversed.value = !reversed.value
  start()
}
start()
// The questions are built from a copy of the words, so start a new round when the set changes
// (e.g. a word was added while this view is open)
watch(() => props.words, start)

const current = computed(() => questions.value[index.value])
const answered = computed(() => picked.value !== null)

function pick(option: string) {
  if (answered.value || !current.value) return
  picked.value = option
  if (option === current.value.answer) score.value++
}
function next() {
  if (index.value + 1 >= questions.value.length) {
    finished.value = true
    return
  }
  index.value++
  picked.value = null
}

// Style of an option button: correct = green, wrong pick = red, others fade once answered
function optionClass(option: string) {
  if (!answered.value) return 'border-default hover:border-primary hover:bg-elevated'
  if (option === current.value?.answer) return 'border-success bg-success/10 text-highlighted'
  if (option === picked.value) return 'border-error bg-error/10 text-highlighted'
  return 'border-default opacity-60'
}
</script>

<template>
  <!-- A multiple choice needs at least two different answers -->
  <div v-if="words.length < 2" class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default py-10 text-center">
    <UIcon name="i-lucide-circle-help" class="size-8 text-muted" />
    <p class="text-sm text-muted">Bộ từ cần có ít nhất 2 từ vựng để học dạng trắc nghiệm.</p>
  </div>

  <!-- Result screen -->
  <div v-else-if="finished" class="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-3xl border border-default bg-default p-8 text-center">
    <UIcon name="i-lucide-trophy" class="size-12 text-primary" />
    <p class="text-2xl font-bold text-highlighted">{{ score }} / {{ questions.length }} câu đúng</p>
    <UProgress :model-value="(score / questions.length) * 100" class="w-full" />
    <UButton icon="i-lucide-rotate-ccw" class="transition duration-200 active:scale-95" @click="start">Làm lại</UButton>
  </div>

  <!-- Question -->
  <div v-else-if="current" class="mx-auto flex max-w-xl flex-col gap-4">
    <div>
      <div class="mb-1 flex justify-between text-sm text-muted">
        <span>Câu {{ index + 1 }} / {{ questions.length }}</span>
        <span>Đúng: {{ score }}</span>
      </div>
      <UProgress :model-value="(index / questions.length) * 100" size="xs" />
    </div>

    <!-- Prompt; keyed so it fades in for each question -->
    <div :key="current.word.id" class="animate-fade-up rounded-3xl border border-default bg-default p-6 text-center shadow-sm">
      <p class="text-xs font-semibold tracking-wide text-muted uppercase">{{ reversed ? 'Từ nào có nghĩa này?' : 'Nghĩa của từ' }}</p>
      <p class="mt-2 text-3xl font-extrabold break-words text-highlighted">{{ promptOf(current.word) }}</p>
      <p v-if="!reversed && current.word.phonetic" class="mt-1 text-muted">{{ current.word.phonetic }}</p>
    </div>

    <!-- 4 answers -->
    <div class="grid gap-2">
      <button
        v-for="(option, i) in current.options"
        :key="`${current.word.id}-${i}`"
        type="button"
        :disabled="answered"
        class="animate-fade-up flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition duration-200 active:scale-[0.99]"
        :class="optionClass(option)"
        :style="{ '--index': i }"
        @click="pick(option)"
      >
        <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-elevated text-sm font-semibold">{{ 'ABCD'[i] }}</span>
        <span class="min-w-0 break-words">{{ option }}</span>
        <UIcon v-if="answered && option === current.answer" name="i-lucide-check" class="ml-auto size-5 shrink-0 text-success" />
        <UIcon v-else-if="answered && option === picked" name="i-lucide-x" class="ml-auto size-5 shrink-0 text-error" />
      </button>
    </div>

    <div class="flex flex-wrap items-center justify-between gap-2">
      <UButton icon="i-lucide-arrow-left-right" :variant="reversed ? 'solid' : 'soft'" class="transition duration-200 active:scale-95" @click="toggleReverse">Đảo ngược</UButton>
      <UButton v-if="answered" trailing-icon="i-lucide-arrow-right" class="transition duration-200 active:scale-95" @click="next">
        {{ index + 1 >= questions.length ? 'Xem kết quả' : 'Câu tiếp' }}
      </UButton>
    </div>
  </div>
</template>
