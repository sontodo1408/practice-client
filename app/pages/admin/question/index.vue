<script setup lang="ts">
import type { Subject } from '~/types/subject'
import type { Question, TopicQuestion } from '~/types/question'
// Imported explicitly: auto-imported components are only available in templates, not in script code
import AdminQuestionForm from '~/components/admin/QuestionForm.vue'

// Admin question management: pick a subject (and optionally a topic), then see topics as
// expandable boxes with their questions inside.
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Questions' })

const subjectApi = useSubjectApi()
const questionApi = useQuestionApi()
const dialogStore = useDialogStore()

// Client-side only: the API calls need the browser cookie and errors open a dialog
const { data: subjects, error: subjectError } = await useAsyncData(
  'admin-question-subjects',
  () => subjectApi.list(),
  { server: false, default: () => [] as Subject[] }
)

// Selected subject id; nothing is shown (and nothing is fetched) until one is chosen
const subjectId = ref<number | undefined>(undefined)
// Topic filter: 0 means "all topics"
const topicFilter = ref<number>(0)

const topics = ref<TopicQuestion[]>([])
const loading = ref(false)
const loadError = ref(false)

async function load() {
  if (subjectId.value === undefined) return
  loading.value = true
  loadError.value = false
  try {
    topics.value = await questionApi.findBySubject(subjectId.value)
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
    loadError.value = true
  } finally {
    loading.value = false
  }
}

// Reload whenever the subject changes and reset the topic filter
watch(subjectId, () => {
  topicFilter.value = 0
  topics.value = []
  load()
})

const subjectItems = computed(() => subjects.value.map(s => ({ label: s.name, value: s.id })))
const topicItems = computed(() => [
  { label: 'All topics', value: 0 },
  ...topics.value.map(t => ({ label: t.topicName, value: t.topicId }))
])

// Topics to render after applying the topic filter, sorted by display order
const visibleTopics = computed(() => topics.value
  .filter(t => topicFilter.value === 0 || t.topicId === topicFilter.value)
  .sort((a, b) => (a.displayOrder ?? Number.MAX_SAFE_INTEGER) - (b.displayOrder ?? Number.MAX_SAFE_INTEGER) || a.topicId - b.topicId))

// ---- Actions ----
async function editQuestion(question: Question) {
  const saved = await dialogStore.content<boolean>({
    title: 'Edit question',
    component: AdminQuestionForm,
    props: { question }
  })
  if (saved) await load()
}

async function removeQuestion(question: Question) {
  const ok = await dialogStore.confirm({
    title: 'Delete question',
    description: `Delete "${question.title}"? This action cannot be undone.`,
    confirmText: 'Delete',
    confirmColor: 'error'
  })
  if (!ok) return
  try {
    await questionApi.remove(question.id)
    await load()
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="motion-safe:animate-fade-up">
      <h1 class="text-2xl font-bold text-highlighted">
        Questions
      </h1>
      <p class="text-sm text-muted">
        Choose a subject to see its topics. Expand a topic to edit or delete its questions.
      </p>
    </div>

    <!-- Subject load error -->
    <UAlert
      v-if="subjectError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Could not load subjects"
    />

    <!-- Client-only: data is fetched in the browser, so SSR output could never match -->
    <ClientOnly v-else>
      <template #fallback>
        <USkeleton class="h-10 w-full max-w-xl" />
      </template>

      <!-- Selectors: subject, then topic filter (disabled until topics are loaded) -->
      <div class="flex max-w-xl gap-3 max-sm:flex-col motion-safe:animate-fade-up">
        <USelect
          v-model="subjectId"
          :items="subjectItems"
          placeholder="Select subject"
          icon="i-lucide-book-open"
          class="w-full"
        />
        <USelect
          v-model="topicFilter"
          :items="topicItems"
          :disabled="subjectId === undefined || !topics.length"
          icon="i-lucide-list-tree"
          class="w-full"
        />
      </div>

      <!-- Nothing is rendered below until a subject is chosen -->
      <template v-if="subjectId !== undefined">
        <UAlert
          v-if="loadError"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Could not load questions"
          class="mt-6"
          :actions="[{ label: 'Retry', color: 'error', variant: 'outline', onClick: () => load() }]"
        />

        <!-- Skeletons while loading -->
        <div v-else-if="loading" class="mt-6 space-y-3">
          <USkeleton v-for="i in 3" :key="i" class="h-16 w-full" />
        </div>

        <!-- Topic boxes, staggered fade-up -->
        <div v-else-if="visibleTopics.length" class="mt-6 space-y-3">
          <AdminTopicQuestionPanel
            v-for="(topic, index) in visibleTopics"
            :key="topic.topicId"
            :topic="topic"
            class="motion-safe:animate-fade-up"
            :style="{ '--index': index }"
            @edit="editQuestion"
            @remove="removeQuestion"
          />
        </div>

        <!-- Empty state -->
        <div v-else class="mt-6 flex flex-col items-center gap-3 py-16 text-center">
          <UIcon name="i-lucide-inbox" class="size-10 text-dimmed" />
          <p class="text-sm text-muted">
            This subject has no topics or questions yet.
          </p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>
