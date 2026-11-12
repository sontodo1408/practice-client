import type { ResponseApi } from '../../app/types/api'
import type { TopicQuestion } from '../../app/types/question'
import type { UserSubject } from '../../app/types/userSubject'
import type { VocabSet } from '../../app/types/vocab'
import { questionSlug } from '../../app/utils/format'

// Dynamic sitemap: home, every subject and every question, built from the public API.
// Cached for an hour so crawlers hitting it do not load the backend.
const escapeXml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export default defineCachedEventHandler(async (event) => {
  const { public: { apiBase, siteUrl } } = useRuntimeConfig(event)
  const origin = String(siteUrl).replace(/\/$/, '')
  const get = async <T>(path: string) => (await $fetch<ResponseApi<T>>(path, { baseURL: apiBase })).payload

  // [path, priority]
  const urls: [string, string][] = [['/', '1.0']]
  try {
    const subjects = await get<UserSubject[]>('/practice/home/subject')
    // Subjects load in parallel; one failing subject must not break the whole sitemap
    const questionLists = await Promise.all(subjects.map(async (s) => {
      urls.push([`/subject/${s.slug}`, '0.8'])
      return get<TopicQuestion[]>(`/practice/home/question/${s.id}`).catch(() => [] as TopicQuestion[])
    }))
    subjects.forEach((s, i) => {
      for (const group of questionLists[i] ?? []) {
        for (const q of group.questions) urls.push([`/subject/${s.slug}/${questionSlug(q)}`, '0.6'])
      }
    })
  } catch {
    // Backend down: still serve the home entry so the sitemap stays valid
  }

  // Vocabulary: the list page and every set (no userId = all sets). Failure here must not break the rest.
  try {
    const sets = await get<VocabSet[]>('/practice/vocab/set')
    urls.push(['/vocab-learning', '0.7'])
    for (const s of sets) urls.push([`/vocab-learning/${s.slug}`, '0.6'])
  } catch {
    // Vocabulary API down: skip these entries
  }

  const body = urls
    .map(([path, priority]) => `  <url><loc>${escapeXml(origin + path)}</loc><priority>${priority}</priority></url>`)
    .join('\n')
  setResponseHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}, { maxAge: 60 * 60 })
