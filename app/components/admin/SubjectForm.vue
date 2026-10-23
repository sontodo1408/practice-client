<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { Subject, SubjectPayload } from '~/types/subject'
import type { Image } from '~/utils/imgManagement'
// Imported explicitly: it is opened from script code, where auto-imported components are unavailable
import ImageManager from '~/components/admin/ImageManager.vue'

// Create/edit form shown inside a content dialog. Emits "close" with true after a successful save.
const props = defineProps<{ subject?: Subject }>()
const emit = defineEmits<{ close: [saved?: boolean] }>()

const subjectApi = useSubjectApi()

const state = reactive<SubjectPayload>({
  name: props.subject?.name ?? '',
  slug: props.subject?.slug ?? '',
  description: props.subject?.description ?? '',
  imgBanner: props.subject?.imgBanner ?? null
})
const loading = ref(false)
const dialogStore = useDialogStore()

// Open the image manager on top of this form and store the chosen path (e.g. "banner/img_db.png")
async function pickBanner() {
  const image = await dialogStore.content<Image>({
    title: 'Chọn ảnh banner',
    component: ImageManager,
    props: { selected: state.imgBanner },
    widthClass: 'sm:max-w-4xl'
  })
  if (image) state.imgBanner = image.src
}

// Keep the slug in sync with the name until the user edits the slug by hand
const slugTouched = ref(!!props.subject)
watch(() => state.name, (name) => {
  if (!slugTouched.value) state.slug = slugify(name)
})

function validate(values: Partial<SubjectPayload>): FormError[] {
  const errors: FormError[] = []
  if (!values.name?.trim()) errors.push({ name: 'name', message: 'Vui lòng nhập tên' })
  if (!values.slug?.trim()) errors.push({ name: 'slug', message: 'Vui lòng nhập slug' })
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
    errors.push({ name: 'slug', message: 'Chỉ dùng chữ thường không dấu, số và dấu gạch ngang' })
  }
  return errors
}

// Errors are displayed by the global API error dialog; we only stop the spinner
async function onSubmit(event: FormSubmitEvent<SubjectPayload>) {
  loading.value = true
  try {
    if (props.subject) await subjectApi.update(props.subject.id, event.data)
    else await subjectApi.create(event.data)
    emit('close', true)
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UForm :state="state" :validate="validate" class="space-y-4" @submit="onSubmit">
    <UFormField label="Tên" name="name" required>
      <UInput v-model="state.name" class="w-full" autofocus placeholder="VD: Toán học" />
    </UFormField>

    <UFormField label="Slug" name="slug" required help="Dùng trong URL; mặc định được tạo từ tên.">
      <UInput v-model="state.slug" class="w-full" placeholder="VD: toan-hoc" @input="slugTouched = true" />
    </UFormField>

    <UFormField label="Mô tả" name="description">
      <UTextarea v-model="state.description" class="w-full" :rows="4" placeholder="Mô tả ngắn (không bắt buộc)" />
    </UFormField>

    <UFormField label="Ảnh banner" name="imgBanner">
      <div class="flex items-center gap-3">
        <img
          v-if="state.imgBanner"
          :src="imgUrl(state.imgBanner)"
          alt="Ảnh banner"
          class="aspect-video w-40 rounded-lg border border-default object-cover"
        >
        <div
          v-else
          class="flex aspect-video w-40 items-center justify-center rounded-lg border border-dashed border-default text-dimmed"
        >
          <UIcon name="i-lucide-image" class="size-6" />
        </div>
        <div class="flex flex-col gap-2">
          <UButton color="neutral" variant="outline" icon="i-lucide-images" class="transition duration-200 active:scale-95" @click="pickBanner">
            {{ state.imgBanner ? 'Đổi ảnh' : 'Chọn ảnh' }}
          </UButton>
          <UButton v-if="state.imgBanner" color="error" variant="ghost" icon="i-lucide-x" class="transition duration-200 active:scale-95" @click="state.imgBanner = null">
            Bỏ ảnh
          </UButton>
        </div>
      </div>
    </UFormField>

    <!-- Right-aligned actions -->
    <div class="flex justify-end gap-2 pt-2">
      <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="emit('close')">
        Hủy
      </UButton>
      <UButton type="submit" :loading="loading" class="transition duration-200 active:scale-95">
        {{ subject ? 'Lưu thay đổi' : 'Tạo môn học' }}
      </UButton>
    </div>
  </UForm>
</template>
