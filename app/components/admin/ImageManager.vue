<script setup lang="ts">
import type { Image } from '~/utils/imgManagement'

// Image picker shown inside a content dialog: folders on the left, images of the selected folder on the right.
// Emits "close" with the chosen Image (or nothing when cancelled).
const props = defineProps<{ selected?: string | null }>()
const emit = defineEmits<{ close: [image?: Image] }>()

type SortKey = 'name-asc' | 'name-desc' | 'default'

const ALL = '__all__'
const groups = SUBJECT_IMAGE_GROUPS

const activeGroup = ref<string>(ALL)
const search = ref('')
const sort = ref<SortKey>('default')
const current = ref<string | null>(props.selected ?? null)

const sortItems = [
  { label: 'Mặc định', value: 'default' },
  { label: 'Tên A → Z', value: 'name-asc' },
  { label: 'Tên Z → A', value: 'name-desc' }
]

// Sidebar entries: "all" first, then every folder with its image count
const folders = computed(() => [
  { key: ALL, title: 'Tất cả', count: ALL_SUBJECT_IMAGES.length, icon: 'i-lucide-images' },
  ...groups.map(g => ({ key: g.key, title: g.title, count: g.images.length, icon: 'i-lucide-folder' }))
])

// Images of the active folder, filtered by the search text and ordered
const visibleImages = computed(() => {
  const source = activeGroup.value === ALL
    ? ALL_SUBJECT_IMAGES
    : (groups.find(g => g.key === activeGroup.value)?.images ?? [])
  const q = search.value.trim().toLowerCase()
  const list = q
    ? source.filter(i => i.name.toLowerCase().includes(q) || i.src.toLowerCase().includes(q))
    : [...source]
  if (sort.value === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort.value === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name))
  return list
})

const currentImage = computed(() => ALL_SUBJECT_IMAGES.find(i => i.src === current.value))

function confirmSelection() {
  if (currentImage.value) emit('close', currentImage.value)
}
</script>

<template>
  <div class="flex h-[60vh] min-h-80 flex-col gap-4 sm:flex-row">
    <!-- Folder list -->
    <nav class="flex shrink-0 gap-1 overflow-x-auto sm:w-48 sm:flex-col sm:overflow-y-auto sm:border-r sm:border-default sm:pr-3" aria-label="Thư mục ảnh">
      <button
        v-for="folder in folders"
        :key="folder.key"
        type="button"
        class="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition-colors"
        :class="activeGroup === folder.key ? 'bg-primary/10 font-medium text-primary' : 'text-muted hover:bg-elevated'"
        @click="activeGroup = folder.key"
      >
        <UIcon :name="folder.icon" class="size-4 shrink-0" />
        <span class="flex-1 truncate">{{ folder.title }}</span>
        <span class="text-xs text-dimmed">{{ folder.count }}</span>
      </button>
    </nav>

    <!-- Toolbar + image grid -->
    <div class="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <UInput v-model="search" icon="i-lucide-search" placeholder="Tìm ảnh theo tên" class="min-w-40 flex-1" aria-label="Tìm ảnh">
          <template v-if="search" #trailing>
            <UButton icon="i-lucide-x" color="neutral" variant="link" size="xs" aria-label="Xóa tìm kiếm" @click="search = ''" />
          </template>
        </UInput>
        <USelect v-model="sort" :items="sortItems" icon="i-lucide-arrow-down-up" class="w-40" aria-label="Sắp xếp" />
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto">
        <div v-if="visibleImages.length" class="grid grid-cols-2 gap-3 p-1 md:grid-cols-3">
          <button
            v-for="image in visibleImages"
            :key="image.src"
            type="button"
            class="group overflow-hidden rounded-lg border bg-default text-left transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
            :class="current === image.src ? 'border-primary ring-2 ring-primary' : 'border-default'"
            :aria-pressed="current === image.src"
            @click="current = image.src"
            @dblclick="current = image.src; confirmSelection()"
          >
            <img :src="imgUrl(image.src)" :alt="image.name" loading="lazy" class="aspect-video w-full object-cover">
            <span class="block truncate px-2 py-1.5 text-xs text-muted">{{ image.name }}</span>
          </button>
        </div>

        <!-- Empty state -->
        <div v-else class="flex h-full flex-col items-center justify-center gap-2 py-10 text-center">
          <UIcon name="i-lucide-image-off" class="size-10 text-dimmed" />
          <p class="text-sm text-muted">
            {{ search ? 'Không có ảnh nào khớp với tìm kiếm.' : 'Thư mục này chưa có ảnh.' }}
          </p>
        </div>
      </div>
    </div>
  </div>

  <div class="flex justify-end gap-2 pt-4">
    <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="emit('close')">
      Hủy
    </UButton>
    <UButton :disabled="!currentImage" class="transition duration-200 active:scale-95" @click="confirmSelection">
      Chọn ảnh
    </UButton>
  </div>
</template>
