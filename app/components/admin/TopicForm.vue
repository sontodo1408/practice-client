<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { Topic, TopicPayload } from '~/types/topic'

// Create/edit form shown inside a content dialog. Emits "close" with true after a successful save.
// For create, `subjectId` and `nextOrder` are used; for edit, the topic carries its own values.
const props = defineProps<{ subjectId: number, topic?: Topic, nextOrder?: number }>()
const emit = defineEmits<{ close: [saved?: boolean] }>()

const topicApi = useTopicApi()

const state = reactive({
  name: props.topic?.name ?? '',
  slug: props.topic?.slug ?? '',
  description: props.topic?.description ?? ''
})
const loading = ref(false)

// Keep the slug in sync with the name until the user edits the slug by hand
const slugTouched = ref(!!props.topic)
watch(() => state.name, (name) => {
  if (!slugTouched.value) state.slug = slugify(name)
})

function validate(values: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  if (!values.name?.trim()) errors.push({ name: 'name', message: 'Vui lòng nhập tên' })
  if (!values.slug?.trim()) errors.push({ name: 'slug', message: 'Vui lòng nhập slug' })
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
    errors.push({ name: 'slug', message: 'Chỉ dùng chữ thường không dấu, số và dấu gạch ngang' })
  }
  return errors
}

// Errors are displayed by the global API error dialog; we only stop the spinner
async function onSubmit(event: FormSubmitEvent<typeof state>) {
  loading.value = true
  // Parent and display order are kept as-is on edit so this form never changes them
  const payload: TopicPayload = {
    ...event.data,
    subjectId: props.topic?.subjectId ?? props.subjectId,
    parentId: props.topic?.parentId ?? null,
    displayOrder: props.topic?.displayOrder ?? props.nextOrder ?? null
  }
  try {
    if (props.topic) await topicApi.update(props.topic.id, payload)
    else await topicApi.create(payload)
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
      <UInput v-model="state.name" class="w-full" autofocus placeholder="VD: Đại số" />
    </UFormField>

    <UFormField label="Slug" name="slug" required help="Duy nhất trong môn học; mặc định được tạo từ tên.">
      <UInput v-model="state.slug" class="w-full" placeholder="VD: dai-so" @input="slugTouched = true" />
    </UFormField>

    <UFormField label="Mô tả" name="description">
      <UTextarea v-model="state.description" class="w-full" :rows="4" placeholder="Mô tả ngắn (không bắt buộc)" />
    </UFormField>

    <!-- Right-aligned actions -->
    <div class="flex justify-end gap-2 pt-2">
      <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="emit('close')">
        Hủy
      </UButton>
      <UButton type="submit" :loading="loading" class="transition duration-200 active:scale-95">
        {{ topic ? 'Lưu thay đổi' : 'Tạo chủ đề' }}
      </UButton>
    </div>
  </UForm>
</template>
