// Shared SEO setup for every public page: title, description, canonical URL and Open Graph / Twitter tags.
// Values may be getters so they stay reactive while async data loads.
export interface PageSeoOptions {
  title: MaybeRefOrGetter<string | undefined>
  description: MaybeRefOrGetter<string | undefined>
  // Absolute or site-relative image path for social previews
  image?: MaybeRefOrGetter<string | null | undefined>
  // 'article' for content pages such as a question
  type?: 'website' | 'article'
  // Keep the page out of search results (login, admin)
  noindex?: boolean
}

export function usePageSeo(options: PageSeoOptions) {
  const { public: { siteUrl } } = useRuntimeConfig()
  const route = useRoute()
  const origin = String(siteUrl).replace(/\/$/, '')

  // Canonical never carries the query string or hash
  const canonical = computed(() => `${origin}${route.path}`)
  const image = computed(() => {
    const src = toValue(options.image) ?? '/logo.png'
    return src.startsWith('http') ? src : `${origin}${src.startsWith('/') ? '' : '/'}${src}`
  })

  useSeoMeta({
    title: options.title,
    description: options.description,
    robots: options.noindex ? 'noindex, nofollow' : 'index, follow',
    ogTitle: options.title,
    ogDescription: options.description,
    ogType: options.type ?? 'website',
    ogUrl: canonical,
    ogImage: image,
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: image
  })
  useHead({ link: [{ rel: 'canonical', href: canonical }] })

  return { canonical, origin }
}

// Strip Markdown syntax, collapse whitespace and cut text to a snippet that fits a search result description
export function toSnippet(text: string | null | undefined, max = 160) {
  const clean = (text ?? '')
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links and images keep their label
    .replace(/[`*_#>~|]/g, '') // inline markers, headings, quotes, tables
    .replace(/^\s*[-+]\s+/gm, '') // list bullets
    .replace(/\s+/g, ' ')
    .trim()
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean
}
