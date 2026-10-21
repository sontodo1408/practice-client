<script setup lang="ts">
import type { Subject } from '~/types/subject'
import type { Topic } from '~/types/topic'
// Imported explicitly: auto-imported components are only available in templates, not in script code
import AdminTopicForm from '~/components/admin/TopicForm.vue'

// Admin topic management: subjects as expandable cards, topics inside as drag-sortable rows
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Topics' })

const subjectApi = useSubjectApi()
const topicApi = useTopicApi()
const dialogStore = useDialogStore()

// Client-side only: the API calls need the browser cookie and errors open a dialog
const { data: subjects, status: subjectStatus, error: subjectError, refresh: refreshSubjects } = await useAsyncData(
  'admin-topic-subjects',
  () => subjectApi.list(),
  { server: false, default: () => [] as Subject[] }
)
const { data: topics, error: topicError, refresh: refreshTopics } = await useAsyncData(
  'admin-topics',
  () => topicApi.list(),
  { server: false, default: () => [] as Topic[] }
)
const error = computed(() => subjectError.value || topicError.value)
// Same hydration-safe loading flag as the subject page
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const loading = computed(() => mounted.value && subjectStatus.value === 'pending')

// Topics of one subject sorted by display order (missing order goes last, id as tie-breaker)
function topicsOf(subjectId: number) {
  return topics.value
    .filter(t => t.subjectId === subjectId)
    .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER) || a.id - b.id)
}

function reload() {
  return Promise.all([refreshSubjects(), refreshTopics()])
}

// ---- Actions ----
// Create a topic for a subject; new topics go to the end of its list
async function addTopic(subject: Subject) {
  const nextOrder = topicsOf(subject.id).reduce((max, t) => Math.max(max, t.displayOrder ?? 0), 0) + 1
  const saved = await dialogStore.content<boolean>({
    title: `New topic in ${subject.name}`,
    component: AdminTopicForm,
    props: { subjectId: subject.id, nextOrder }
  })
  if (saved) await refreshTopics()
}

async function editTopic(topic: Topic) {
  const saved = await dialogStore.content<boolean>({
    title: 'Edit topic',
    component: AdminTopicForm,
    props: { subjectId: topic.subjectId, topic }
  })
  if (saved) await refreshTopics()
}

async function removeTopic(topic: Topic) {
  const ok = await dialogStore.confirm({
    title: 'Delete topic',
    description: `Delete "${topic.name}"? This action cannot be undone.`,
    confirmText: 'Delete',
    confirmColor: 'error'
  })
  if (!ok) return
  try {
    await topicApi.remove(topic.id)
    await refreshTopics()
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  }
}

// Persist a new order of one subject's topics with a single call; the server sets display_order to 1..n
async function reorder(subjectId: number, ids: number[]) {
  // Optimistic update so the list does not jump back while saving
  const position = new Map(ids.map((id, index) => [id, index + 1]))
  topics.value = topics.value.map(t => position.has(t.id) ? { ...t, displayOrder: position.get(t.id)! } : t)

  try {
    await topicApi.reorder(subjectId, ids)
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  } finally {
    // Always reload so the screen matches the server (also rolls back after a failure)
    await refreshTopics()
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="motion-safe:animate-fade-up">
      <h1 class="text-2xl font-bold text-highlighted">
        Topics
      </h1>
      <p class="text-sm text-muted">
        Expand a subject to manage its topics. Drag the grip handle to change the display order.
      </p>
    </div>

    <!-- Load error with retry -->
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Could not load topics"
      :actions="[{ label: 'Retry', color: 'error', variant: 'outline', onClick: () => reload() }]"
    />

    <!-- Client-only: data is fetched in the browser, so SSR output could never match -->
    <ClientOnly v-else>
      <template #fallback>
        <div class="space-y-3">
          <USkeleton v-for="i in 4" :key="i" class="h-16 w-full" />
        </div>
      </template>

      <!-- Skeletons while the first load is running -->
      <div v-if="loading && !subjects.length" class="space-y-3">
        <USkeleton v-for="i in 4" :key="i" class="h-16 w-full" />
      </div>

      <!-- Subject cards, staggered fade-up -->
      <div v-else-if="subjects.length" class="space-y-3">
        <AdminSubjectTopicPanel
          v-for="(subject, index) in subjects"
          :key="subject.id"
          :subject="subject"
          :topics="topicsOf(subject.id)"
          class="motion-safe:animate-fade-up"
          :style="{ '--index': index }"
          @add="addTopic(subject)"
          @edit="editTopic"
          @remove="removeTopic"
          @reorder="reorder(subject.id, $event)"
        />
      </div>

      <!-- Empty state: topics belong to subjects, so subjects are needed first -->
      <div v-else class="flex flex-col items-center gap-3 py-16 text-center">
        <UIcon name="i-lucide-inbox" class="size-10 text-dimmed" />
        <p class="text-sm text-muted">
          No subjects yet. Create a subject first, then add topics to it.
        </p>
        <UButton to="/admin/subject" variant="soft" icon="i-lucide-book-open">
          Go to subjects
        </UButton>
      </div>
    </ClientOnly>
  </div>
</template>
