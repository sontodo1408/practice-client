<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { VocabWord, VocabWordPayload } from '~/types/vocab'

// Create/edit form for a word inside a set, shown in a content dialog. Emits "close" with true after saving.
// With "user" the word is saved through the user API (POST /vocab/word) instead of the admin one.
const props = defineProps<{ setId: number, word?: VocabWord, user?: boolean }>()
const emit = defineEmits<{ close: [saved?: boolean] }>()

const adminApi = useVocabAdminApi()
const userApi = useVocabApi()

const state = reactive<VocabWordPayload>({
  id: props.word?.id,
  setId: props.setId,
  word: props.word?.word ?? '',
  phonetic: props.word?.phonetic ?? '',
  wordType: props.word?.wordType ?? undefined,
  wordLevel: props.word?.wordLevel ?? undefined,
  meaning: props.word?.meaning ?? '',
  example: props.word?.example ?? ''
})
const loading = ref(false)

function validate(values: Partial<VocabWordPayload>): FormError[] {
  const errors: FormError[] = []
  if (!values.word?.trim()) errors.push({ name: 'word', message: 'Vui lòng nhập từ vựng' })
  if (!values.meaning?.trim()) errors.push({ name: 'meaning', message: 'Vui lòng nhập nghĩa' })
  return errors
}

// Errors are displayed by the global API error dialog; we only stop the spinner
async function onSubmit(event: FormSubmitEvent<VocabWordPayload>) {
  loading.value = true
  try {
    const payload = { ...event.data, id: props.word?.id, setId: props.setId }
    if (props.user) await userApi.saveWord(payload)
    else await adminApi.saveWord(payload)
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
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Từ vựng" name="word" required>
        <UInput v-model="state.word" class="w-full" autofocus placeholder="VD: resilient" />
      </UFormField>
      <UFormField label="Phiên âm" name="phonetic">
        <UInput v-model="state.phonetic" class="w-full" placeholder="VD: /rɪˈzɪliənt/" />
      </UFormField>
      <UFormField label="Loại từ" name="wordType">
        <USelect v-model="state.wordType" :items="VOCAB_WORD_TYPES" class="w-full" placeholder="Chọn loại từ" />
      </UFormField>
      <UFormField label="Cấp độ" name="wordLevel">
        <USelect v-model="state.wordLevel" :items="VOCAB_WORD_LEVELS" class="w-full" placeholder="Chọn cấp độ" />
      </UFormField>
    </div>

    <UFormField label="Nghĩa" name="meaning" required>
      <UTextarea v-model="state.meaning" class="w-full" :rows="2" placeholder="Nghĩa tiếng Việt" />
    </UFormField>

    <UFormField label="Ví dụ" name="example">
      <UTextarea v-model="state.example" class="w-full" :rows="2" placeholder="Câu ví dụ (không bắt buộc)" />
    </UFormField>

    <!-- Right-aligned actions -->
    <div class="flex justify-end gap-2 pt-2">
      <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="emit('close')">
        Hủy
      </UButton>
      <UButton type="submit" :loading="loading" class="transition duration-200 active:scale-95">
        {{ word ? 'Lưu thay đổi' : 'Thêm từ vựng' }}
      </UButton>
    </div>
  </UForm>
</template>
