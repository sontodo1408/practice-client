<script setup lang="ts">
import type { Question } from '~/types/question'
import type { SubjectSectionData, UserSubject } from '~/types/userSubject'

// Public subject page: left panel (info + topics), right side (one question table per topic)
definePageMeta({ layout: 'user' })

const route = useRoute()
const router = useRouter()
const api = useUserSubjectApi()
const learnedStore = useLearnedStore()

const slug = computed(() => String(route.params.slug))
const subject = ref<UserSubject | null>(null)
const sections = ref<SubjectSectionData[]>([])
const loading = ref(true)
const notFound = ref(false)
const loadError = ref('')

useSeoMeta({ title: () => subject.value?.name ?? 'Môn học' })

// Slug of the topic currently in view, highlighted in the sidebar
const activeId = ref('')
// Question shown in the dialog
const selected = ref<Question | null>(null)
const dialogOpen = ref(false)

// Id of the "no topic" group the backend returns for questions without a topic
const OTHER_ID = 'other'

// Load subject (found by slug in the public list), then its topics and questions in parallel
async function load() {
  loading.value = true
  loadError.value = ''
  notFound.value = false
  try {
    const found = (await api.listAll()).find(s => s.slug === slug.value)
    if (!found) {
      notFound.value = true
      return
    }
    subject.value = found
    // Opening a subject starts it: saves { subjectId: [] } in localStorage so it shows under "Đang học"
    learnedStore.startStudying(found.id)
    const [topics, grouped] = await Promise.all([api.listTopics(found.id), api.listQuestions(found.id)])

    // Questions by topic id; topics keep the backend order
    const byTopic = new Map(grouped.map(g => [g.topicId, g.questions]))
    const result: SubjectSectionData[] = [...topics]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map(t => ({ id: t.slug, name: t.name, description: t.description, questions: byTopic.get(t.id) ?? [] }))
    // Questions with no topic go to a last group
    const orphans = grouped.find(g => g.topicId == null)
    if (orphans?.questions.length) {
      result.push({ id: OTHER_ID, name: 'Khác', description: null, questions: orphans.questions })
    }
    sections.value = result
    activeId.value = result[0]?.id ?? ''
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
    loadError.value = e.message
  } finally {
    loading.value = false
  }
  // Wait for the sections to render, then follow the URL hash and start tracking the visible topic
  await nextTick()
  observeSections()
  if (route.hash) scrollToSection(route.hash.slice(1))
}

// Smooth scroll to a topic and keep the URL hash in sync (without adding history entries)
function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  activeId.value = id
  history.replaceState(history.state, '', `#${id}`)
}

// Highlight the topic that crosses the upper part of the viewport while scrolling
let observer: IntersectionObserver | undefined
function observeSections() {
  observer?.disconnect()
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) activeId.value = entry.target.id
    }
  }, { rootMargin: '-15% 0px -75% 0px' })
  sections.value.forEach((s) => {
    const el = document.getElementById(s.id)
    if (el) observer?.observe(el)
  })
}

// Go to the previous in-app page; fall back to home when the page was opened directly (no history)
function goBack() {
  if (window.history.state?.back) router.back()
  else navigateTo('/')
}

function openQuestion(question: Question) {
  selected.value = question
  dialogOpen.value = true
}

// localStorage is only available in the browser
onMounted(() => {
  learnedStore.load()
  load()
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div>
    <!-- Single root element (required for page transitions); the states below are mutually exclusive -->
    <!-- Loading skeleton with the same two-column shape -->
    <div v-if="loading" class="grid gap-6 lg:grid-cols-[18rem_1fr]">
      <USkeleton class="h-72 rounded-2xl" />
      <div class="space-y-4">
        <USkeleton class="h-8 w-1/3" />
        <USkeleton class="h-48 rounded-2xl" />
        <USkeleton class="h-48 rounded-2xl" />
      </div>
    </div>

    <!-- Unknown slug -->
    <div v-else-if="notFound" class="flex flex-col items-center gap-3 py-16 text-center">
      <UIcon name="i-lucide-search-x" class="size-10 text-muted" />
      <p class="text-lg font-semibold text-highlighted">Không tìm thấy môn học</p>
      <UButton to="/" icon="i-lucide-arrow-left" class="active:scale-95">Về trang chủ</UButton>
    </div>

    <!-- Request failed -->
    <UAlert
      v-else-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Không thể tải môn học này"
      :description="loadError"
      :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: load }]"
    />

    <div v-else-if="subject" class="animate-fade-up grid gap-6 lg:grid-cols-[18rem_1fr]">
      <!-- Left: sticky on desktop, stacked on top on mobile -->
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <!-- Back button above the info card: always visible next to the topic list on desktop -->
        <UButton
          icon="i-lucide-arrow-left"
          label="Quay lại"
          color="neutral"
          variant="ghost"
          class="mb-[6px] -ml-2.5 active:scale-95"
          @click="goBack"
        />
        <UserSubjectSidebar :subject="subject" :sections="sections" :active-id="activeId" @select="scrollToSection" />
      </aside>

      <!-- Right: one table per topic -->
      <div class="min-w-0 space-y-10">
        <UserTopicSection
          v-for="(s, i) in sections"
          :key="s.id"
          :section="s"
          :subject-id="subject.id"
          class="animate-fade-up"
          :style="{ '--index': i }"
          @open="openQuestion"
        />
        <p v-if="!sections.length" class="py-10 text-center text-muted">Chưa có chủ đề nào</p>
      </div>

      <UserQuestionDialog v-model:open="dialogOpen" :question="selected" />
    </div>
  </div>
</template>
