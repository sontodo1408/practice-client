<script setup lang="ts">
// Public subject page: left panel (info + topics), right side (one question table per topic)
definePageMeta({ layout: 'user' })

const route = useRoute()
const learnedStore = useLearnedStore()

const slug = computed(() => String(route.params.slug))

// Loaded on the server as well, so the topic and question titles are in the HTML crawlers receive
const { data, status, refresh } = await useSubjectDetail(slug)
const subject = computed(() => data.value?.subject ?? null)
const sections = computed(() => data.value?.sections ?? [])
const loadError = computed(() => data.value?.error ?? '')
const loading = computed(() => status.value === 'pending' && !subject.value)
const notFound = computed(() => status.value !== 'pending' && !subject.value && !loadError.value)

// An unknown slug answers with a real 404 status for search engines
if (notFound.value && import.meta.server) setResponseStatus(useRequestEvent()!, 404)

// SEO: title and description come from the subject; fall back to generic text while it is missing
usePageSeo({
  title: () => (subject.value ? `Câu hỏi phỏng vấn ${subject.value.name}` : 'Bộ câu hỏi'),
  // Keyword-rich lead sentence first, then the subject's own description
  description: () => subject.value
    ? toSnippet(`Tổng hợp ${subject.value.questionCount} câu hỏi phỏng vấn ${subject.value.name} có đáp án, chấm điểm bằng AI. ${subject.value.description ?? ''}`)
    : 'Bộ câu hỏi phỏng vấn lập trình có đáp án.',
  image: () => (subject.value?.imgBanner ? imgUrl(subject.value.imgBanner) : null)
})
// Structured data: lets search engines show the subject as a course
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: () => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Course',
      'name': subject.value?.name,
      'description': subject.value?.description ?? undefined
    })
  }]
})

// Slug of the topic currently in view, highlighted in the sidebar
const activeId = ref('')

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

// Browser-only work once the content is rendered: progress storage, topic tracking, URL hash
async function setupClient() {
  if (!subject.value) return
  // Opening a subject starts it: saves { subjectId: [] } in localStorage so it shows under "Đang học"
  learnedStore.startStudying(subject.value.id)
  activeId.value = sections.value[0]?.id ?? ''
  await nextTick()
  observeSections()
  if (route.hash) scrollToSection(route.hash.slice(1))
}

// localStorage is only available in the browser
onMounted(() => {
  learnedStore.load()
  setupClient()
})
// Another subject (or a retry) finished loading
watch(subject, () => { if (import.meta.client) setupClient() })
onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <div>
    <!-- Single root element (required for page transitions); the states below are mutually exclusive -->
    <!-- Loading skeleton with the same two-column shape -->
    <div v-if="loading" class="space-y-6">
      <USkeleton class="h-40 rounded-3xl" />
      <div class="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <USkeleton class="h-72 rounded-2xl" />
        <div class="space-y-4">
          <USkeleton class="h-8 w-1/3" />
          <USkeleton class="h-48 rounded-2xl" />
          <USkeleton class="h-48 rounded-2xl" />
        </div>
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
      :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => refresh() }]"
    />

    <div v-else-if="subject" class="animate-fade-up">
      <!-- Breadcrumb: Trang chủ > subject (current page, not a link) -->
      <AppBreadcrumb :items="[{ label: subject.name }]" class="mb-4" />

      <!-- Banner: subject info, progress ring and the continue button -->
      <UserSubjectHero :subject="subject" :sections="sections" class="mb-6" />

      <div class="grid gap-6 lg:grid-cols-[18rem_1fr]">
        <!-- Left: sticky on desktop, stacked on top on mobile -->
        <aside class="lg:sticky lg:top-24 lg:self-start">
          <UserSubjectSidebar :subject="subject" :sections="sections" :active-id="activeId" @select="scrollToSection" />
        </aside>

        <!-- Right: one table per topic -->
        <div class="min-w-0 space-y-10">
          <UserTopicSection
            v-for="(s, i) in sections"
            :key="s.id"
            :section="s"
            :subject-id="subject.id"
            :subject-slug="subject.slug"
            class="animate-fade-up"
            :style="{ '--index': i }"
          />
          <p v-if="!sections.length" class="py-10 text-center text-muted">Chưa có chủ đề nào</p>
        </div>
      </div>
    </div>
  </div>
</template>
