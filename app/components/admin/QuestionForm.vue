<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { Difficulty, Question, QuestionPayload } from '~/types/question'

// Edit form shown inside a content dialog. Emits "close" with true after a successful save.
const props = defineProps<{ question: Question }>()
const emit = defineEmits<{ close: [saved?: boolean] }>()

const questionApi = useQuestionApi()

const difficultyItems: { label: string, value: Difficulty }[] = [
  { label: 'Dễ', value: 'EASY' },
  { label: 'Trung bình', value: 'MEDIUM' },
  { label: 'Khó', value: 'HARD' }
]

const state = reactive({
  title: props.question.title ?? '',
  question: props.question.question ?? '',
  answer: props.question.answer ?? '',
  difficulty: props.question.difficulty
})
const loading = ref(false)

function validate(values: Partial<typeof state>): FormError[] {
  const errors: FormError[] = []
  if (!values.title?.trim()) errors.push({ name: 'title', message: 'Vui lòng nhập tiêu đề' })
  if (!values.question?.trim()) errors.push({ name: 'question', message: 'Vui lòng nhập câu hỏi' })
  return errors
}

// Errors are displayed by the global API error dialog; we only stop the spinner
async function onSubmit(event: FormSubmitEvent<typeof state>) {
  loading.value = true
  // Subject and topic stay as-is: this form never moves a question
  const payload: QuestionPayload = {
    ...event.data,
    subjectId: props.question.subjectId,
    topicId: props.question.topicId
  }
  try {
    await questionApi.update(props.question.id, payload)
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
    <UFormField label="Tiêu đề" name="title" required>
      <UInput v-model="state.title" class="w-full" autofocus />
    </UFormField>

    <UFormField label="Độ khó" name="difficulty">
      <USelect v-model="state.difficulty" :items="difficultyItems" class="w-full" />
    </UFormField>

    <UFormField label="Câu hỏi" name="question" required>
      <UTextarea v-model="state.question" class="w-full" :rows="5" />
    </UFormField>

    <UFormField label="Đáp án" name="answer">
      <UTextarea v-model="state.answer" class="w-full" :rows="5" />
    </UFormField>

    <!-- Right-aligned actions -->
    <div class="flex justify-end gap-2 pt-2">
      <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="emit('close')">
        Hủy
      </UButton>
      <UButton type="submit" :loading="loading" class="transition duration-200 active:scale-95">
        Lưu thay đổi
      </UButton>
    </div>
  </UForm>
</template>
