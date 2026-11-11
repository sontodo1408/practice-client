// Decorative icon and accent color per subject. The backend has no such fields, so both are picked from the
// subject id (stable across reloads). Shared by the home card and the subject page hero so a subject keeps
// the same look on both screens.

// Accent palette; class names are written out in full so Tailwind can detect them
export interface SubjectAccent {
  // Solid call-to-action button colors (a plain link is styled with these; Nuxt UI semantic colors do not map to these hues)
  btn: string
  // Card hover border + glow
  card: string
  // Icon tile (the group-hover part is for cards)
  tile: string
  // Progress ring stroke
  ring: string
  // Small accent text / icon
  arrow: string
  // Hero banner: gradient background + border, and the two floating blobs
  hero: string
  blobA: string
  blobB: string
}

const ACCENTS: SubjectAccent[] = [
  {
    btn: 'bg-brand-600 hover:bg-brand-700',
    card: 'hover:border-brand-400 hover:shadow-brand-500/15',
    tile: 'bg-brand-100 text-brand-600 group-hover:bg-brand-500 dark:bg-brand-950 dark:text-brand-400',
    ring: 'stroke-brand-500',
    arrow: 'text-brand-500',
    hero: 'border-brand-200/60 from-brand-50 via-white to-brand-100 dark:border-brand-900/40 dark:from-brand-950 dark:via-neutral-900 dark:to-neutral-950',
    blobA: 'bg-brand-300/50 dark:bg-brand-700/25',
    blobB: 'bg-brand-400/40 dark:bg-brand-600/20'
  },
  {
    btn: 'bg-blue-600 hover:bg-blue-700',
    card: 'hover:border-blue-400 hover:shadow-blue-500/15',
    tile: 'bg-blue-100 text-blue-600 group-hover:bg-blue-500 dark:bg-blue-950 dark:text-blue-400',
    ring: 'stroke-blue-500',
    arrow: 'text-blue-500',
    hero: 'border-blue-200/60 from-blue-50 via-white to-blue-100 dark:border-blue-900/40 dark:from-blue-950 dark:via-neutral-900 dark:to-neutral-950',
    blobA: 'bg-blue-300/50 dark:bg-blue-700/25',
    blobB: 'bg-blue-400/40 dark:bg-blue-600/20'
  },
  {
    btn: 'bg-violet-600 hover:bg-violet-700',
    card: 'hover:border-violet-400 hover:shadow-violet-500/15',
    tile: 'bg-violet-100 text-violet-600 group-hover:bg-violet-500 dark:bg-violet-950 dark:text-violet-400',
    ring: 'stroke-violet-500',
    arrow: 'text-violet-500',
    hero: 'border-violet-200/60 from-violet-50 via-white to-violet-100 dark:border-violet-900/40 dark:from-violet-950 dark:via-neutral-900 dark:to-neutral-950',
    blobA: 'bg-violet-300/50 dark:bg-violet-700/25',
    blobB: 'bg-violet-400/40 dark:bg-violet-600/20'
  },
  {
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    card: 'hover:border-emerald-400 hover:shadow-emerald-500/15',
    tile: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 dark:bg-emerald-950 dark:text-emerald-400',
    ring: 'stroke-emerald-500',
    arrow: 'text-emerald-500',
    hero: 'border-emerald-200/60 from-emerald-50 via-white to-emerald-100 dark:border-emerald-900/40 dark:from-emerald-950 dark:via-neutral-900 dark:to-neutral-950',
    blobA: 'bg-emerald-300/50 dark:bg-emerald-700/25',
    blobB: 'bg-emerald-400/40 dark:bg-emerald-600/20'
  },
  {
    btn: 'bg-rose-600 hover:bg-rose-700',
    card: 'hover:border-rose-400 hover:shadow-rose-500/15',
    tile: 'bg-rose-100 text-rose-600 group-hover:bg-rose-500 dark:bg-rose-950 dark:text-rose-400',
    ring: 'stroke-rose-500',
    arrow: 'text-rose-500',
    hero: 'border-rose-200/60 from-rose-50 via-white to-rose-100 dark:border-rose-900/40 dark:from-rose-950 dark:via-neutral-900 dark:to-neutral-950',
    blobA: 'bg-rose-300/50 dark:bg-rose-700/25',
    blobB: 'bg-rose-400/40 dark:bg-rose-600/20'
  },
  {
    btn: 'bg-amber-600 hover:bg-amber-700',
    card: 'hover:border-amber-400 hover:shadow-amber-500/15',
    tile: 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 dark:bg-amber-950 dark:text-amber-400',
    ring: 'stroke-amber-500',
    arrow: 'text-amber-500',
    hero: 'border-amber-200/60 from-amber-50 via-white to-amber-100 dark:border-amber-900/40 dark:from-amber-950 dark:via-neutral-900 dark:to-neutral-950',
    blobA: 'bg-amber-300/50 dark:bg-amber-700/25',
    blobB: 'bg-amber-400/40 dark:bg-amber-600/20'
  }
]

const ICONS = [
  'i-lucide-calculator',
  'i-lucide-atom',
  'i-lucide-flask-conical',
  'i-lucide-dna',
  'i-lucide-languages',
  'i-lucide-landmark',
  'i-lucide-globe',
  'i-lucide-code'
]

// Accent palette for a subject id
export const subjectAccent = (id: number): SubjectAccent => ACCENTS[id % ACCENTS.length]!

// Decorative icon for a subject id
export const subjectIcon = (id: number): string => ICONS[id % ICONS.length]!
