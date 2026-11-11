<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { AIType, Setting, SettingPayload } from '~/types/setting'

// Admin settings: configure the AI provider, model, API key and bean (usage credit) limits
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Cài đặt' })

const settingApi = useSettingApi()

// Provider options for the select
const aiTypeItems: { label: string, value: AIType }[] = [
  { label: 'Gemini', value: 'GEMINI' },
  { label: 'Claude', value: 'CLAUDE' }
]

// Client-side only: the API call needs the browser cookie. A failed load (e.g. "not configured yet")
// resolves to null so the form is shown empty instead of an error state.
const { data: setting, status, refresh } = await useAsyncData<Setting | null>(
  'admin-setting',
  async () => {
    try {
      return await settingApi.get()
    } catch (e) {
      if (!(e instanceof ApiError)) throw e
      return null
    }
  },
  { server: false, default: () => null }
)
// Avoid a hydration mismatch: on the server status is 'idle' but on the client it is already 'pending'
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const loading = computed(() => !mounted.value || status.value === 'pending')

// ---- Form state ----
const state = reactive<SettingPayload>({
  aiType: 'GEMINI',
  aiModel: '',
  apiKey: '',
  dailyBeanLimit: 0,
  beanPerQuestion: 1,
  promptQuestion: '',
  promptVocab: ''
})
const saving = ref(false)
// Toggle to reveal the API key while typing
const showKey = ref(false)

// Ready-made review prompt (4 %s: subject, topic, question, answer) so admins don't have to type it from scratch
const SAMPLE_PROMPT = `Hãy review câu trả lời của người học cho câu hỏi dưới đây.
subject: %s-%s
question: %s
answer: %s

Hãy trả lời bằng tiếng Việt, đúng theo cấu trúc sau:
1. Điểm: x/10 (dựa trên độ chính xác, đầy đủ và rõ ràng, dựa vào ý, không bắt bẻ câu từ vì là văn nói)
2. Nhận xét: nêu điểm đúng, điểm sai hoặc còn thiếu trong câu trả lời
3. Giải thích: trình bày kiến thức liên quan để người học hiểu đúng bản chất
4. Đáp án gợi ý: viết lại một câu trả lời mẫu ngắn gọn, chính xác`

// Ready-made vocabulary prompt (1 %s: the list of "word: sentence" lines the user wrote)
const SAMPLE_PROMPT_VOCAB = `Tôi đang luyện đặt câu tiếng Anh với từ khóa. Với mỗi từ khóa, tôi đã đặt một câu tiếng Anh phải có chứa từ khóa đó. Hãy review các câu dưới đây, xem câu của tôi với từng từ khóa có đúng hay không, nếu sai thì chỉ ra chỗ sai.
Danh sách (mỗi dòng theo dạng "từ khóa: câu của tôi"):
%s

Hãy trả lời bằng tiếng Việt, với mỗi từ khóa theo đúng cấu trúc sau:
- Từ khóa: ...
- Kết quả: Đúng / Sai
- Nếu sai: chỉ rõ chỗ sai (ngữ pháp, cách dùng từ, chính tả...) và giải thích ngắn gọn
- Câu gợi ý: viết lại câu đúng (hoặc câu mẫu tự nhiên hơn)`

function applySamplePrompt() {
  state.promptQuestion = SAMPLE_PROMPT
}
function applySamplePromptVocab() {
  state.promptVocab = SAMPLE_PROMPT_VOCAB
}

// Copy a sample prompt to the clipboard and confirm with a toast
async function copySamplePrompt(text = SAMPLE_PROMPT) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({ title: 'Đã sao chép prompt mẫu', color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: 'Không thể sao chép, hãy chọn và copy thủ công', color: 'error' })
  }
}

// ---- Model suggestions ----
const { listModels } = useAiModelApi()
const toast = useToast()
const models = ref<string[]>([])
const loadingModels = ref(false)
// Select items: downloaded models plus the current value, so a stored/custom model is always displayed
const modelItems = computed(() => [...new Set([state.aiModel, ...models.value].filter(Boolean))])
// Models belong to one provider, so drop the loaded list when the provider changes
watch(() => state.aiType, () => { models.value = [] })

// Download the model list from the selected provider using the key typed in the form
async function loadModels() {
  const key = state.apiKey.trim()
  if (!key) {
    // The stored key is masked by the backend, so a fresh key must be entered to query the provider
    toast.add({ title: 'Vui lòng nhập API key trước', description: 'Key đã lưu được ẩn, hãy dán key để tải danh sách model.', color: 'warning', icon: 'i-lucide-key-round' })
    return
  }
  loadingModels.value = true
  try {
    models.value = await listModels(state.aiType, key)
    toast.add({ title: `Đã tải ${models.value.length} model`, color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: 'Không thể tải danh sách model', description: 'Hãy kiểm tra nhà cung cấp và API key.', color: 'error', icon: 'i-lucide-circle-alert' })
  } finally {
    loadingModels.value = false
  }
}

// Copy the stored values into the form; the API key field always starts empty
function fillFromSetting(value: Setting) {
  state.id = value.id
  state.aiType = value.aiType
  state.aiModel = value.aiModel ?? ''
  state.dailyBeanLimit = value.dailyBeanLimit ?? 0
  state.beanPerQuestion = value.beanPerQuestion ?? 1
  state.promptQuestion = value.promptQuestion ?? ''
  state.promptVocab = value.promptVocab ?? ''
  state.apiKey = ''
}

// Refill the form whenever the stored setting is (re)loaded
watch(setting, (value) => {
  if (value) fillFromSetting(value)
}, { immediate: true })

function validate(values: Partial<SettingPayload>): FormError[] {
  const errors: FormError[] = []
  if (!values.aiType) errors.push({ name: 'aiType', message: 'Vui lòng chọn nhà cung cấp AI' })
  if (!values.aiModel?.trim()) errors.push({ name: 'aiModel', message: 'Vui lòng nhập model' })
  // A key is mandatory only for the very first configuration
  if (!setting.value && !values.apiKey?.trim()) errors.push({ name: 'apiKey', message: 'Vui lòng nhập API key' })
  if (values.dailyBeanLimit == null || !Number.isInteger(values.dailyBeanLimit) || values.dailyBeanLimit < 0) {
    errors.push({ name: 'dailyBeanLimit', message: 'Nhập số nguyên lớn hơn hoặc bằng 0' })
  }
  if (values.beanPerQuestion == null || !Number.isInteger(values.beanPerQuestion) || values.beanPerQuestion < 0) {
    errors.push({ name: 'beanPerQuestion', message: 'Nhập số nguyên lớn hơn hoặc bằng 0' })
  }
  if (!values.promptQuestion?.trim()) {
    errors.push({ name: 'promptQuestion', message: 'Vui lòng nhập prompt review câu trả lời' })
  } else if ((values.promptQuestion.match(/%s/g) ?? []).length !== 4) {
    // The backend fills subject, topic, question and answer in order via String.format
    errors.push({ name: 'promptQuestion', message: 'Prompt phải chứa đúng 4 ký tự %s (subject, chủ đề, câu hỏi, câu trả lời)' })
  }
  // Optional (the sentence review is not live yet), but when filled it must hold the single list placeholder
  if (values.promptVocab?.trim() && (values.promptVocab.match(/%s/g) ?? []).length !== 1) {
    errors.push({ name: 'promptVocab', message: 'Prompt phải chứa đúng 1 ký tự %s (danh sách từ khóa và câu của người dùng)' })
  }
  return errors
}

// Save, then reload so the masked key and updated time reflect the stored values.
// Errors are displayed by the global API error dialog; we only stop the spinner.
async function onSubmit(event: FormSubmitEvent<SettingPayload>) {
  saving.value = true
  try {
    await settingApi.update({ ...event.data, aiModel: event.data.aiModel.trim(), promptQuestion: event.data.promptQuestion.trim(), promptVocab: event.data.promptVocab.trim(), apiKey: event.data.apiKey.trim() })
    await refresh()
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  } finally {
    saving.value = false
  }
}

// Discard unsaved edits by restoring the stored values
function reset() {
  if (setting.value) fillFromSetting(setting.value)
  else state.apiKey = ''
}
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="motion-safe:animate-fade-up">
      <h1 class="text-2xl font-bold text-highlighted">
        Cài đặt
      </h1>
      <p class="text-sm text-muted">
        Cấu hình nhà cung cấp AI và giới hạn bean dùng để tạo câu hỏi.
      </p>
    </div>

    <!-- Skeleton while the setting loads -->
    <div v-if="loading" class="grid gap-6 lg:grid-cols-3">
      <USkeleton class="h-80 lg:col-span-2" />
      <USkeleton class="h-48" />
    </div>

    <!-- Desktop: two columns (provider wide, limits narrow); smaller screens stack -->
    <UForm
      v-else
      :state="state"
      :validate="validate"
      class="grid items-start gap-6 lg:grid-cols-3"
      @submit="onSubmit"
    >
      <!-- AI provider card -->
      <UCard class="motion-safe:animate-fade-up lg:col-span-2" style="--index: 1">
        <template #header>
          <div class="flex items-center gap-2 font-semibold text-highlighted">
            <UIcon name="i-lucide-sparkles" class="size-5 text-primary" />
            Nhà cung cấp AI
          </div>
        </template>

        <div class="space-y-4">
          <!-- First-run hint when nothing is stored yet -->
          <UAlert
            v-if="!setting"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Chưa được cấu hình"
            description="Điền vào biểu mẫu và lưu để tạo cài đặt đầu tiên."
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Nhà cung cấp" name="aiType" required>
              <USelect v-model="state.aiType" :items="aiTypeItems" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Model" name="aiModel" required>
              <!-- Searchable list filled by the download button; a typed name not in the list can still be added.
                   Unlike a native datalist, the full list stays visible when a value is already selected. -->
              <div class="flex gap-2">
                <USelectMenu
                  v-model="state.aiModel"
                  :items="modelItems"
                  create-item
                  class="w-full"
                  placeholder="VD: gemini-2.5-flash"
                  :search-input="{ placeholder: 'Tìm hoặc nhập tên model...' }"
                  @create="(name: string) => { state.aiModel = name }"
                />
                <UTooltip text="Tải danh sách model khả dụng">
                  <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="outline"
                    :loading="loadingModels"
                    aria-label="Tải danh sách model khả dụng"
                    class="transition duration-200 active:scale-95"
                    @click="loadModels"
                  />
                </UTooltip>
              </div>
            </UFormField>
          </div>

          <UFormField
            label="API key"
            name="apiKey"
            :required="!setting"
            :help="setting?.apiKeyMasked ? `Key hiện tại: ${setting.apiKeyMasked}. Để trống để giữ nguyên.` : 'Được lưu mã hóa trên máy chủ.'"
          >
            <UInput
              v-model="state.apiKey"
              class="w-full"
              :type="showKey ? 'text' : 'password'"
              autocomplete="off"
              placeholder="Dán API key mới"
            >
              <template #trailing>
                <UButton
                  :icon="showKey ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="link"
                  size="xs"
                  :aria-label="showKey ? 'Ẩn API key' : 'Hiện API key'"
                  @click="showKey = !showKey"
                />
              </template>
            </UInput>
          </UFormField>

          <UFormField
            label="Prompt review câu trả lời"
            name="promptQuestion"
            required
            help="Dùng đúng 4 ký tự %s theo thứ tự: subject, chủ đề, câu hỏi, câu trả lời của người dùng."
          >
            <UTextarea v-model="state.promptQuestion" :rows="12" autoresize :maxrows="24" class="w-full font-mono" />
          </UFormField>

          <!-- Suggested prompt: fill the field or copy it in one click -->
          <div class="rounded-lg border border-default bg-elevated/50 p-3">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span class="flex items-center gap-1.5 text-sm font-medium text-highlighted">
                <UIcon name="i-lucide-lightbulb" class="size-4 text-primary" />
                Gợi ý prompt
              </span>
              <div class="flex gap-2">
                <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-copy" @click="copySamplePrompt()">
                  Sao chép
                </UButton>
                <UButton size="xs" icon="i-lucide-wand-sparkles" @click="applySamplePrompt">
                  Dùng prompt này
                </UButton>
              </div>
            </div>
            <pre class="max-h-60 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted">{{ SAMPLE_PROMPT }}</pre>
          </div>

          <!-- Prompt used to review the sentences written in the vocabulary "Đặt câu" mode -->
          <UFormField
            label="Prompt review đặt câu từ vựng"
            name="promptVocab"
            help="Dùng đúng 1 ký tự %s: danh sách các dòng “từ khóa: câu của người dùng”. Để trống nếu chưa dùng."
          >
            <UTextarea v-model="state.promptVocab" :rows="10" autoresize :maxrows="24" class="w-full font-mono" />
          </UFormField>

          <div class="rounded-lg border border-default bg-elevated/50 p-3">
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span class="flex items-center gap-1.5 text-sm font-medium text-highlighted">
                <UIcon name="i-lucide-lightbulb" class="size-4 text-primary" />
                Gợi ý prompt từ vựng
              </span>
              <div class="flex gap-2">
                <UButton size="xs" color="neutral" variant="outline" icon="i-lucide-copy" @click="copySamplePrompt(SAMPLE_PROMPT_VOCAB)">
                  Sao chép
                </UButton>
                <UButton size="xs" icon="i-lucide-wand-sparkles" @click="applySamplePromptVocab">
                  Dùng prompt này
                </UButton>
              </div>
            </div>
            <pre class="max-h-60 overflow-auto whitespace-pre-wrap font-mono text-xs text-muted">{{ SAMPLE_PROMPT_VOCAB }}</pre>
          </div>
        </div>
      </UCard>

      <!-- Bean limits card -->
      <UCard class="motion-safe:animate-fade-up" style="--index: 2">
        <template #header>
          <div class="flex items-center gap-2 font-semibold text-highlighted">
            <UIcon name="i-lucide-coins" class="size-5 text-primary" />
            Giới hạn bean
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Giới hạn bean mỗi ngày" name="dailyBeanLimit" required help="Số bean tối đa mỗi người dùng có thể dùng trong một ngày.">
            <UInputNumber v-model="state.dailyBeanLimit" :min="0" class="w-full" />
          </UFormField>
          <UFormField label="Bean mỗi câu hỏi" name="beanPerQuestion" required help="Chi phí để tạo một câu hỏi.">
            <UInputNumber v-model="state.beanPerQuestion" :min="0" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <!-- Footer: last update time and actions -->
      <div class="motion-safe:animate-fade-up flex flex-wrap items-center justify-between gap-3 lg:col-span-3" style="--index: 3">
        <span class="text-sm text-muted">
          <template v-if="setting">Cập nhật lần cuối {{ formatDateTime(setting.updatedAt) }}</template>
        </span>
        <div class="flex gap-2">
          <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="reset">
            Đặt lại
          </UButton>
          <UButton
            type="submit"
            icon="i-lucide-save"
            :loading="saving"
            class="transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            Lưu cài đặt
          </UButton>
        </div>
      </div>
    </UForm>
  </div>
</template>
