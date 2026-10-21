<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { Subject, SubjectPayload } from '~/types/subject'

// Create/edit form shown inside a content dialog. Emits "close" with true after a successful save.
const props = defineProps<{ subject?: Subject }>()
const emit = defineEmits<{ close: [saved?: boolean] }>()

const subjectApi = useSubjectApi()

const state = reactive<SubjectPayload>({
  name: props.subject?.name ?? '',
  slug: props.subject?.slug ?? '',
  description: props.subject?.description ?? ''
})
const loading = ref(false)

// Keep the slug in sync with the name until the user edits the slug by hand
const slugTouched = ref(!!props.subject)
watch(() => state.name, (name) => {
  if (!slugTouched.value) state.slug = slugify(name)
})

function validate(values: Partial<SubjectPayload>): FormError[] {
  const errors: FormError[] = []
  if (!values.name?.trim()) errors.push({ name: 'name', message: 'Name is required' })
  if (!values.slug?.trim()) errors.push({ name: 'slug', message: 'Slug is required' })
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
    errors.push({ name: 'slug', message: 'Use lowercase letters, numbers and dashes only' })
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
    <UFormField label="Name" name="name" required>
      <UInput v-model="state.name" class="w-full" autofocus placeholder="e.g. Mathematics" />
    </UFormField>

    <UFormField label="Slug" name="slug" required help="Used in URLs; generated from the name by default.">
      <UInput v-model="state.slug" class="w-full" placeholder="e.g. mathematics" @input="slugTouched = true" />
    </UFormField>

    <UFormField label="Description" name="description">
      <UTextarea v-model="state.description" class="w-full" :rows="4" placeholder="Optional short description" />
    </UFormField>

    <!-- Right-aligned actions -->
    <div class="flex justify-end gap-2 pt-2">
      <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="emit('close')">
        Cancel
      </UButton>
      <UButton type="submit" :loading="loading" class="transition duration-200 active:scale-95">
        {{ subject ? 'Save changes' : 'Create subject' }}
      </UButton>
    </div>
  </UForm>
</template>
