// Turn free text into a URL-friendly slug (strips Vietnamese diacritics too)
export function slugify(text: string) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// URL segment of a question: "<id>_<title with underscores>", e.g. 1_java_la_gi (the id is what the page looks up)
export function questionSlug(question: { id: number, title: string }) {
  const title = slugify(question.title).replace(/-/g, '_').slice(0, 80).replace(/_+$/, '')
  return title ? `${question.id}_${title}` : String(question.id)
}

// Read the question id back from a URL segment; null when it does not start with a number
export function parseQuestionId(segment: string) {
  const match = /^(\d+)(?:_|$)/.exec(segment)
  return match ? Number(match[1]) : null
}

// Short human-readable date/time for table cells; empty string for missing/invalid values
export function formatDateTime(value: string | null | undefined) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}
