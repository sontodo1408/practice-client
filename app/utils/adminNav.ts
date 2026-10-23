import type { NavigationMenuItem } from '@nuxt/ui'

// Sidebar entries shared by every admin screen; add new admin routes here
export const adminNavItems: NavigationMenuItem[] = [
  { label: 'Môn học', icon: 'i-lucide-book-open', to: '/admin/subject' },
  { label: 'Chủ đề', icon: 'i-lucide-list-tree', to: '/admin/topic' },
  { label: 'Câu hỏi', icon: 'i-lucide-circle-help', to: '/admin/question' },
  { label: 'Cài đặt', icon: 'i-lucide-settings', to: '/admin/setting' }
]
