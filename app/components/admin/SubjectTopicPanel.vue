<script setup lang="ts">
import type { Subject } from '~/types/subject'
import type { Topic } from '~/types/topic'

// Expandable subject card: header (toggle + add button) and, when open, a drag-sortable list of topics.
// Reordering uses SortableJS (via useSortableList), started only from the grip handle.
const props = defineProps<{ subject: Subject, topics: Topic[] }>()
const emit = defineEmits<{
  add: []
  edit: [topic: Topic]
  remove: [topic: Topic]
  // Full list of topic ids in their new order; only emitted when the order really changed
  reorder: [ids: number[]]
}>()

const open = ref(false)

// Local copy so a dropped row stays in place until the parent reloads; re-synced when the parent data changes
const items = ref<Topic[]>([...props.topics])
watch(() => props.topics, (value) => { items.value = [...value] })

// Topic list element that SortableJS controls
const listEl = ref<HTMLElement | null>(null)
useSortableList(listEl, {
  handle: '.topic-handle',
  ghostClass: 'topic-ghost',
  onMove: (oldIndex, newIndex) => {
    const next = [...items.value]
    const [moved] = next.splice(oldIndex, 1)
    next.splice(newIndex, 0, moved!)
    items.value = next
    emit('reorder', next.map(t => t.id))
  }
})
</script>

<template>
  <UCard :ui="{ body: 'p-0 sm:p-0' }" class="overflow-hidden transition duration-200 hover:shadow-md">
    <!-- Header: toggle area + add-topic button (kept separate so + does not toggle) -->
    <div class="flex items-center gap-2 p-3 sm:p-4">
      <button
        type="button"
        class="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left focus-visible:outline-2 focus-visible:outline-primary"
        :aria-expanded="open"
        @click="open = !open"
      >
        <UIcon
          name="i-lucide-chevron-right"
          class="size-5 shrink-0 text-muted transition-transform duration-300"
          :class="{ 'rotate-90': open }"
        />
        <span class="min-w-0">
          <span class="block truncate font-semibold text-highlighted">{{ subject.name }}</span>
          <span class="block truncate text-sm text-muted">{{ subject.description || subject.slug }}</span>
        </span>
      </button>
      <UBadge color="neutral" variant="subtle" :label="`${items.length} chủ đề`" />
      <UTooltip text="Thêm chủ đề">
        <UButton
          icon="i-lucide-plus"
          variant="soft"
          :aria-label="`Thêm chủ đề vào ${subject.name}`"
          class="transition duration-200 active:scale-95"
          @click="emit('add')"
        />
      </UTooltip>
    </div>

    <!-- Collapsible body: animates height via grid rows (0fr -> 1fr) -->
    <div class="grid transition-[grid-template-rows] duration-300 ease-out" :class="open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'">
      <div class="overflow-hidden" :inert="!open">
        <ul
          v-if="items.length"
          ref="listEl"
          class="divide-y divide-default border-t border-default"
        >
          <li
            v-for="topic in items"
            :key="topic.id"
            class="flex items-center gap-2 bg-default px-3 py-2 transition-colors hover:bg-elevated sm:px-4"
          >
            <!-- Grip handle: the only element that starts a drag -->
            <span
              class="topic-handle flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded text-dimmed hover:text-primary active:cursor-grabbing"
              role="img"
              aria-label="Kéo để sắp xếp lại"
            >
              <UIcon name="i-lucide-grip-vertical" class="size-5" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate font-medium text-highlighted">{{ topic.name }}</p>
              <p v-if="topic.description" class="truncate text-sm text-muted">{{ topic.description }}</p>
            </div>
            <UBadge color="primary" variant="subtle" :label="topic.slug" class="max-sm:hidden" />
            <UButton
              icon="i-lucide-pencil"
              color="neutral"
              variant="ghost"
              :aria-label="`Sửa ${topic.name}`"
              class="transition duration-200 active:scale-95"
              @click="emit('edit', topic)"
            />
            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              :aria-label="`Xóa ${topic.name}`"
              class="transition duration-200 active:scale-95"
              @click="emit('remove', topic)"
            />
          </li>
        </ul>

        <!-- Empty state for a subject without topics -->
        <p v-else class="border-t border-default px-4 py-6 text-center text-sm text-muted">
          Chưa có chủ đề nào. Dùng nút + để thêm.
        </p>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
/* Placeholder row shown by SortableJS at the drop position while dragging */
.topic-ghost {
  opacity: 0.6;
  /* Tint from the primary token so it also looks right in dark mode */
  background-color: color-mix(in oklab, var(--ui-primary) 15%, transparent);
}
</style>
