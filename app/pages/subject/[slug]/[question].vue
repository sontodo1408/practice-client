<script setup lang="ts">
// Public question page: /subject/<subject-slug>/<id>_<title>. Replaces the old practice dialog.
// The id in the URL is what is looked up; the title part only makes the URL readable for people and search engines.
definePageMeta({ layout: 'user' })

const route = useRoute()
const learnedStore = useLearnedStore()

const slug = computed(() => String(route.params.slug))
const segment = computed(() => String(route.params.question))
const questionId = computed(() => parseQuestionId(segment.value))

// QuestionController data (current, previous, next, same-subject list); rendered on the server for crawlers
const { data, status, refresh } = await useQuestionPage(slug, questionId)
const subject = computed(() => data.value?.subject ?? null)
// Name from the question endpoint (falls back to the subject list while it is missing)
const subjectName = computed(() => data.value?.page?.subjectName ?? subject.value?.name ?? '')
const question = computed(() => data.value?.page?.curQuestion ?? null)
const prev = computed(() => data.value?.page?.previousQuestion ?? null)
const next = computed(() => data.value?.page?.nextQuestion ?? null)
// The list already starts with the next question, which has its own card above it
const related = computed(() => (data.value?.page?.sameSubjectQuestions ?? []).filter(q => q.id !== next.value?.id))

const loading = computed(() => status.value === 'pending' && !question.value)
const notFound = computed(() => status.value !== 'pending' && data.value?.failure === 'notFound')
const loadError = computed(() => (data.value?.failure === 'error' ? data.value.message : ''))

// Real 404 status for unknown ids; wrong or outdated title part redirects (301) to the canonical URL
if (import.meta.server && notFound.value) setResponseStatus(useRequestEvent()!, 404)
if (question.value && segment.value !== questionSlug(question.value)) {
  await navigateTo(`/subject/${slug.value}/${questionSlug(question.value)}`, { redirectCode: 301, replace: true })
}

// Short human label of the difficulty
const difficultyLabel = computed(() => (question.value?.difficulty === 'HARD' ? 'Kiến thức Senior' : 'Cần nắm vững'))

// SEO: unique title and description per question; the page is an article-type result
const { canonical } = usePageSeo({
  // e.g. "Java là gì? - Câu hỏi phỏng vấn Java Core"
  title: () => (question.value ? `${question.value.title} - Câu hỏi phỏng vấn ${subjectName.value}`.trim() : 'Câu hỏi'),
  description: () => (question.value ? toSnippet(question.value.question) : 'Câu hỏi luyện tập phỏng vấn.'),
  image: () => (subject.value?.imgBanner ? imgUrl(subject.value.imgBanner) : null),
  type: 'article'
})
// Structured data: article about the question (the breadcrumb trail adds its own BreadcrumbList).
// The model answer stays out on purpose: it is hidden behind the hint button, and structured data must
// describe content visible to the user.
useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: () => JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Article',
      'headline': question.value?.title,
      'description': toSnippet(question.value?.question),
      'inLanguage': 'vi',
      'datePublished': question.value?.createdAt ?? undefined,
      'dateModified': question.value?.updatedAt ?? undefined,
      'mainEntityOfPage': canonical.value,
      'isPartOf': { '@type': 'Course', 'name': subjectName.value }
    })
  }]
})

// Breadcrumb: Trang chủ > subject (link) > current question (no link)
const crumbs = computed(() => [
  { label: subjectName.value, to: `/subject/${slug.value}` },
  { label: question.value?.title ?? '' }
])

// Opening a question starts the subject (shows under "Đang học") and loads saved progress; browser only
onMounted(() => {
  learnedStore.load()
  if (subject.value) learnedStore.startStudying(subject.value.id)
})

// Link to another question of the same subject
const linkTo = (q: { id: number, title: string }) => `/subject/${slug.value}/${questionSlug(q)}`
</script>

<template>
  <div>
    <!-- Single root element (required for page transitions); the states below are mutually exclusive -->
    <!-- Loading skeleton -->
    <div v-if="loading" class="mx-auto max-w-3xl space-y-4">
      <USkeleton class="h-5 w-1/2" />
      <USkeleton class="h-10 w-3/4" />
      <USkeleton class="h-64 rounded-2xl" />
    </div>

    <!-- Unknown subject or question id -->
    <div v-else-if="notFound" class="flex flex-col items-center gap-3 py-16 text-center">
      <UIcon name="i-lucide-search-x" class="size-10 text-muted" />
      <p class="text-lg font-semibold text-highlighted">Không tìm thấy câu hỏi</p>
      <UButton :to="`/subject/${slug}`" icon="i-lucide-arrow-left" class="active:scale-95">Về môn học</UButton>
    </div>

    <!-- Request failed -->
    <UAlert
      v-else-if="loadError"
      color="error"
      variant="subtle"
      icon="i-lucide-circle-alert"
      title="Không thể tải câu hỏi này"
      :description="loadError"
      :actions="[{ label: 'Thử lại', color: 'error', variant: 'outline', onClick: () => refresh() }]"
    />

    <article v-else-if="question && subject" class="animate-fade-up mx-auto max-w-3xl">
      <!-- Breadcrumb: Trang chủ > subject (link) > this question; also gives crawlers internal links -->
      <AppBreadcrumb :items="crumbs" class="mb-4" />

      <header class="mb-6">
        <UBadge :label="difficultyLabel" color="primary" variant="soft" class="mb-2" />
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">{{ question.title }}</h1>
      </header>

      <!-- Practice area: answer box, hint, AI check (logic moved from the old dialog) -->
      <div class="rounded-2xl border border-default bg-default p-4 pt-0 sm:p-6 sm:pt-0">
        <UserQuestionPractice
          :key="question.id"
          :question="question"
          :subject-name="subject.name"
          :subject-description="subject.description"
        />
      </div>

      <!-- Previous / next question of the subject: keeps readers moving and links pages together -->
      <nav aria-label="Câu hỏi trước và sau" class="mt-6 grid gap-3 sm:grid-cols-2">
        <NuxtLink
          v-if="prev"
          :to="linkTo(prev)"
          rel="prev"
          class="group flex items-center gap-3 rounded-xl border border-default bg-default p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg active:scale-95 motion-reduce:transition-none"
        >
          <UIcon name="i-lucide-arrow-left" class="size-5 shrink-0 text-muted group-hover:text-primary" />
          <span class="min-w-0">
            <span class="block text-xs text-muted">Câu trước</span>
            <span class="block truncate text-sm text-highlighted">{{ prev.title }}</span>
          </span>
        </NuxtLink>
        <span v-else class="hidden sm:block" />
        <NuxtLink
          v-if="next"
          :to="linkTo(next)"
          rel="next"
          class="group flex items-center justify-end gap-3 rounded-xl border border-default bg-default p-3 text-right transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg active:scale-95 motion-reduce:transition-none"
        >
          <span class="min-w-0">
            <span class="block text-xs text-muted">Câu tiếp theo</span>
            <span class="block truncate text-sm text-highlighted">{{ next.title }}</span>
          </span>
          <UIcon name="i-lucide-arrow-right" class="size-5 shrink-0 text-muted group-hover:text-primary" />
        </NuxtLink>
      </nav>

      <!-- More questions of the same subject (real links, good for crawling and for keeping readers here) -->
      <section v-if="related.length" class="mt-8" aria-labelledby="related-title">
        <h2 id="related-title" class="mb-3 text-lg font-semibold text-highlighted">Câu hỏi khác trong {{ subject.name }}</h2>
        <ul class="divide-y divide-default overflow-hidden rounded-2xl border border-default bg-default">
          <li v-for="q in related" :key="q.id">
            <NuxtLink
              :to="linkTo(q)"
              class="block px-4 py-2.5 text-sm text-default transition-colors duration-200 hover:bg-elevated hover:text-primary"
            >
              {{ q.title }}
            </NuxtLink>
          </li>
        </ul>
      </section>
    </article>
  </div>
</template>
