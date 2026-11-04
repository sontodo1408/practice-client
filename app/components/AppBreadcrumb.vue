<script setup lang="ts">
import type { BreadcrumbItem } from '@nuxt/ui'

// Shared breadcrumb for every screen except home. "Trang chủ" is always the first (clickable) crumb; the last
// crumb is the current page and is never a link. Also emits BreadcrumbList structured data for search engines.
export interface Crumb {
  label: string
  // Omit for crumbs that are not navigable (the current page, or a group such as "Quản trị")
  to?: string
}

const props = withDefaults(defineProps<{
  items: Crumb[]
  // Disable for screens that are not indexed (login, admin)
  schema?: boolean
}>(), { schema: true })

const route = useRoute()
const { public: { siteUrl } } = useRuntimeConfig()
const origin = String(siteUrl).replace(/\/$/, '')

// Home first; the last crumb loses its link because the user is already on it
const crumbs = computed<BreadcrumbItem[]>(() => {
  const all: Crumb[] = [{ label: 'Trang chủ', to: '/' }, ...props.items]
  return all.map((c, i) => ({
    label: c.label,
    icon: i === 0 ? 'i-lucide-house' : undefined,
    to: i === all.length - 1 ? undefined : c.to
  }))
})

// Structured data: the current page uses the route path as its URL
if (props.schema) {
  useHead({
    script: [{
      type: 'application/ld+json',
      innerHTML: () => JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': [{ label: 'Trang chủ', to: '/' }, ...props.items].map((c, i) => ({
          '@type': 'ListItem',
          'position': i + 1,
          'name': c.label,
          'item': `${origin}${c.to ?? route.path}`
        }))
      })
    }]
  })
}
</script>

<template>
  <!-- Long labels (question titles) are truncated so the trail never overflows on phones -->
  <UBreadcrumb
    :items="crumbs"
    :ui="{ linkLabel: 'max-w-48 truncate sm:max-w-80', link: 'transition-colors duration-200 hover:text-primary' }"
  />
</template>
