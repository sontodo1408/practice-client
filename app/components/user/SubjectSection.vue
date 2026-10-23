<script setup lang="ts">
import type { UserSubject } from '~/types/userSubject'

// Titled grid of subject blocks with loading skeletons, empty state and staggered enter animation
withDefaults(defineProps<{
  title: string
  subjects: UserSubject[]
  loading?: boolean
  // Text shown when there is nothing to list
  emptyText?: string
  emptyIcon?: string
}>(), {
  loading: false,
  emptyText: 'Chưa có nội dung',
  emptyIcon: 'i-lucide-inbox'
})
</script>

<template>
  <section class="animate-fade-up">
    <h2 class="mb-4 text-xl font-bold text-highlighted sm:text-2xl">{{ title }}</h2>

    <!-- Loading: skeleton squares -->
    <div v-if="loading" class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
      <USkeleton v-for="n in 4" :key="n" class="aspect-square rounded-2xl" />
    </div>

    <!-- Empty state; the slot can add an action (e.g. a sign-in button) -->
    <div
      v-else-if="!subjects.length"
      class="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-default py-10 text-center"
    >
      <UIcon :name="emptyIcon" class="size-8 text-muted" />
      <p class="text-sm text-muted">{{ emptyText }}</p>
      <slot name="empty" />
    </div>

    <!-- Cards; TransitionGroup animates search filtering, --index staggers the first render -->
    <TransitionGroup
      v-else
      name="card"
      tag="div"
      class="relative grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
    >
      <UserSubjectCard
        v-for="(subject, i) in subjects"
        :key="subject.id"
        :subject="subject"
        class="animate-fade-up"
        :style="{ '--index': i }"
      />
    </TransitionGroup>
  </section>
</template>
