<script setup lang="ts">
import type { VocabWord } from '~/types/vocab'

// Sentence mode: every word gets a text box to write a sentence with it.
// "Gửi review" sends only the filled boxes to the AI (POST /ai/review/vocab) and shows its feedback below.
const props = defineProps<{ words: VocabWord[] }>()

const aiApi = useAiApi()

// Sentence typed for each word, keyed by word id
const sentences = reactive<Record<number, string>>({})
const checking = ref(false)
// AI feedback (Markdown); null until a review has been requested
const feedback = ref<string | null>(null)

// Words whose sentence is not blank, in the order of the list
const filled = computed(() => props.words.filter(w => sentences[w.id]?.trim()))

// Send the filled sentences; errors are shown by useApi's dialog, so only the spinner is reset here
async function submit() {
  if (!filled.value.length || checking.value) return
  checking.value = true
  try {
    feedback.value = await aiApi.reviewVocab(filled.value.map(w => ({ word: w.word, example: sentences[w.id]!.trim() })))
  } catch {
    // useApi already displayed the error dialog
  } finally {
    checking.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <UAlert
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="Hãy đặt một câu tiếng Anh với mỗi từ"
      description="Chỉ những ô đã nhập câu mới được gửi đi để AI nhận xét."
    />

    <ul class="space-y-3">
      <li
        v-for="(w, i) in words"
        :key="w.id"
        class="animate-fade-up rounded-2xl border border-default bg-default p-4"
        :style="{ '--index': Math.min(i, 8) }"
      >
        <div class="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span class="text-lg font-bold text-highlighted">{{ w.word }}</span>
          <span v-if="w.phonetic" class="text-sm text-muted">{{ w.phonetic }}</span>
          <UBadge v-if="w.wordLevel" :label="w.wordLevel" color="neutral" variant="subtle" size="sm" />
        </div>
        <p class="mb-2 text-sm text-muted">{{ w.meaning }}</p>
        <UTextarea
          v-model="sentences[w.id]"
          class="w-full"
          :rows="2"
          autoresize
          :disabled="checking"
          :placeholder="`Đặt câu với “${w.word}”...`"
          :aria-label="`Câu với từ ${w.word}`"
        />
      </li>
    </ul>

    <!-- AI feedback fades in once the review returns; the AI replies in Markdown -->
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
        <MDC :value="feedback" tag="div" class="text-sm text-default" />
      </div>
    </Transition>

    <!-- Sticky-free action row: count of sentences that will be sent + the submit button -->
    <div class="flex flex-wrap items-center justify-between gap-3">
      <span class="text-sm text-muted">Đã nhập {{ filled.length }} / {{ words.length }} câu</span>
      <UButton
        icon="i-lucide-send"
        :loading="checking"
        :disabled="!filled.length"
        class="transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
        @click="submit"
      >
        Gửi review
      </UButton>
    </div>
  </div>
</template>
