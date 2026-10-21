import type { NavigationMenuItem } from '@nuxt/ui'

// Sidebar entries shared by every admin screen; add new admin routes here
export const adminNavItems: NavigationMenuItem[] = [
  { label: 'Subjects', icon: 'i-lucide-book-open', to: '/admin/subject' },
  { label: 'Topics', icon: 'i-lucide-list-tree', to: '/admin/topic' },
  { label: 'Questions', icon: 'i-lucide-circle-help', to: '/admin/question' },
  { label: 'Settings', icon: 'i-lucide-settings', to: '/admin/setting' }
]
