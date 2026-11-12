<script setup lang="ts">
import type { VocabWord } from '~/types/vocab'

// Flashcard mode: one card at a time that flips between two faces.
// Front = word + phonetic, back = meaning + example. "Reverse" swaps which face is shown first; "Shuffle" randomizes the order.
const props = defineProps<{ words: VocabWord[] }>()

// Current order of the deck (original order until shuffled)
const deck = ref<VocabWord[]>([...props.words])
const index = ref(0)
const flipped = ref(false)
const reversed = ref(false)
const shuffled = ref(false)

const current = computed(() => deck.value[index.value])

// The set can change while this view is open (e.g. a word was added): the deck is a copy, so sync it.
// Keep the current position and shuffled order; new words are appended, removed ones dropped.
watch(() => props.words, (words) => {
  if (shuffled.value) {
    const known = new Set(deck.value.map(w => w.id))
    deck.value = [...deck.value.map(w => words.find(n => n.id === w.id)).filter((w): w is VocabWord => !!w), ...words.filter(w => !known.has(w.id))]
  } else {
    deck.value = [...words]
  }
  if (index.value >= deck.value.length) index.value = Math.max(0, deck.value.length - 1)
})

// Move to another card; always show the first face of the new card
function go(step: number) {
  const next = index.value + step
  if (next < 0 || next >= deck.value.length) return
  flipped.value = false
  index.value = next
}
function flip() {
  flipped.value = !flipped.value
}
// Toggle between a random order and the original order
function toggleShuffle() {
  shuffled.value = !shuffled.value
  deck.value = shuffled.value ? shuffle(props.words) : [...props.words]
  index.value = 0
  flipped.value = false
}
function toggleReverse() {
  reversed.value = !reversed.value
  flipped.value = false
}

// Arrow keys move, space / enter flips (ignored while typing in a field)
function onKey(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null
  if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return
  if (e.key === 'ArrowRight') go(1)
  else if (e.key === 'ArrowLeft') go(-1)
  else if (e.key === ' ') {
    e.preventDefault()
    flip()
  }
}
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="current" class="flex flex-col items-center gap-5">
    <!-- Progress -->
    <div class="w-full max-w-xl">
      <div class="mb-1 flex justify-between text-sm text-muted">
        <span>Thẻ {{ index + 1 }} / {{ deck.length }}</span>
        <span v-if="shuffled" class="flex items-center gap-1"><UIcon name="i-lucide-shuffle" class="size-4" /> Đã xáo trộn</span>
      </div>
      <UProgress :model-value="((index + 1) / deck.length) * 100" size="xs" />
    </div>

    <!-- The card: click to flip. A hidden twin of each face keeps screen readers on the visible side only. -->
    <button
      type="button"
      class="vocab-card group w-full max-w-xl cursor-pointer rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
      :aria-label="flipped ? 'Lật lại mặt đầu' : 'Lật thẻ để xem mặt sau'"
      @click="flip"
    >
      <div class="vocab-card-inner relative h-72 transition-transform duration-500 sm:h-80" :class="{ 'is-flipped': flipped }">
        <!-- Face A: word + phonetic (or meaning + example when reversed) -->
        <div
          class="vocab-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-default bg-default p-6 text-center shadow-md transition-shadow group-hover:shadow-xl"
          :aria-hidden="flipped"
        >
          <template v-if="!reversed">
            <p class="text-3xl font-extrabold break-words text-highlighted sm:text-4xl">{{ current.word }}</p>
            <p v-if="current.phonetic" class="text-lg text-muted">{{ current.phonetic }}</p>
          </template>
          <template v-else>
            <p class="text-2xl font-bold break-words text-highlighted sm:text-3xl">{{ current.meaning }}</p>
            <p v-if="current.example" class="max-w-md text-sm text-muted italic">{{ current.example }}</p>
          </template>
          <span class="absolute bottom-4 text-xs text-dimmed">Nhấn để lật</span>
        </div>

        <!-- Face B: the opposite side -->
        <div
          class="vocab-face vocab-face-back absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-primary/30 bg-brand-50 p-6 text-center shadow-md transition-shadow group-hover:shadow-xl dark:bg-brand-950"
          :aria-hidden="!flipped"
        >
          <template v-if="!reversed">
            <p class="text-2xl font-bold break-words text-highlighted sm:text-3xl">{{ current.meaning }}</p>
            <p v-if="current.example" class="max-w-md text-sm text-muted italic">{{ current.example }}</p>
          </template>
          <template v-else>
            <p class="text-3xl font-extrabold break-words text-highlighted sm:text-4xl">{{ current.word }}</p>
            <p v-if="current.phonetic" class="text-lg text-muted">{{ current.phonetic }}</p>
          </template>
          <span class="absolute bottom-4 text-xs text-dimmed">Nhấn để lật lại</span>
        </div>
      </div>
    </button>

    <!-- Controls: previous / flip / next, then shuffle and reverse toggles -->
    <div class="flex flex-wrap items-center justify-center gap-2">
      <UButton icon="i-lucide-arrow-left" color="neutral" variant="outline" :disabled="index === 0" aria-label="Thẻ trước" class="transition duration-200 active:scale-95" @click="go(-1)" />
      <UButton icon="i-lucide-rotate-3d" color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="flip">Lật thẻ</UButton>
      <UButton icon="i-lucide-arrow-right" color="neutral" variant="outline" :disabled="index === deck.length - 1" aria-label="Thẻ sau" class="transition duration-200 active:scale-95" @click="go(1)" />
    </div>
    <div class="flex flex-wrap items-center justify-center gap-2">
      <UButton icon="i-lucide-shuffle" :variant="shuffled ? 'solid' : 'soft'" class="transition duration-200 active:scale-95" @click="toggleShuffle">Xáo bài</UButton>
      <UButton icon="i-lucide-arrow-left-right" :variant="reversed ? 'solid' : 'soft'" class="transition duration-200 active:scale-95" @click="toggleReverse">Đảo ngược</UButton>
    </div>
  </div>
</template>

<style scoped>
/* 3D flip: the card rotates around the Y axis; each face hides its back so only one shows at a time */
.vocab-card {
  perspective: 1200px;
}
.vocab-card-inner {
  transform-style: preserve-3d;
}
.vocab-card-inner.is-flipped {
  transform: rotateY(180deg);
}
.vocab-face {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.vocab-face-back {
  transform: rotateY(180deg);
}
/* Honor reduced motion: swap faces without the spin */
@media (prefers-reduced-motion: reduce) {
  .vocab-card-inner {
    transition: none;
  }
}
</style>
