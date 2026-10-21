<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { AIType, Setting, SettingPayload } from '~/types/setting'

// Admin settings: configure the AI provider, model, API key and bean (usage credit) limits
definePageMeta({ layout: 'admin' })
useSeoMeta({ title: 'Settings' })

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
  beanPerQuestion: 1
})
const saving = ref(false)
// Toggle to reveal the API key while typing
const showKey = ref(false)

// ---- Model suggestions ----
const { listModels } = useAiModelApi()
const toast = useToast()
const models = ref<string[]>([])
const loadingModels = ref(false)
// Models belong to one provider, so drop the loaded list when the provider changes
watch(() => state.aiType, () => { models.value = [] })

// Download the model list from the selected provider using the key typed in the form
async function loadModels() {
  const key = state.apiKey.trim()
  if (!key) {
    // The stored key is masked by the backend, so a fresh key must be entered to query the provider
    toast.add({ title: 'Enter the API key first', description: 'The stored key is hidden, paste it to load models.', color: 'warning', icon: 'i-lucide-key-round' })
    return
  }
  loadingModels.value = true
  try {
    models.value = await listModels(state.aiType, key)
    toast.add({ title: `Loaded ${models.value.length} models`, color: 'success', icon: 'i-lucide-check-circle' })
  } catch {
    toast.add({ title: 'Could not load models', description: 'Check the provider and API key.', color: 'error', icon: 'i-lucide-circle-alert' })
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
  state.apiKey = ''
}

// Refill the form whenever the stored setting is (re)loaded
watch(setting, (value) => {
  if (value) fillFromSetting(value)
}, { immediate: true })

function validate(values: Partial<SettingPayload>): FormError[] {
  const errors: FormError[] = []
  if (!values.aiType) errors.push({ name: 'aiType', message: 'AI provider is required' })
  if (!values.aiModel?.trim()) errors.push({ name: 'aiModel', message: 'Model is required' })
  // A key is mandatory only for the very first configuration
  if (!setting.value && !values.apiKey?.trim()) errors.push({ name: 'apiKey', message: 'API key is required' })
  if (values.dailyBeanLimit == null || !Number.isInteger(values.dailyBeanLimit) || values.dailyBeanLimit < 0) {
    errors.push({ name: 'dailyBeanLimit', message: 'Enter a whole number, 0 or greater' })
  }
  if (values.beanPerQuestion == null || !Number.isInteger(values.beanPerQuestion) || values.beanPerQuestion < 0) {
    errors.push({ name: 'beanPerQuestion', message: 'Enter a whole number, 0 or greater' })
  }
  return errors
}

// Save, then reload so the masked key and updated time reflect the stored values.
// Errors are displayed by the global API error dialog; we only stop the spinner.
async function onSubmit(event: FormSubmitEvent<SettingPayload>) {
  saving.value = true
  try {
    await settingApi.update({ ...event.data, aiModel: event.data.aiModel.trim(), apiKey: event.data.apiKey.trim() })
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
        Settings
      </h1>
      <p class="text-sm text-muted">
        Configure the AI provider and the bean limits used for question generation.
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
            AI provider
          </div>
        </template>

        <div class="space-y-4">
          <!-- First-run hint when nothing is stored yet -->
          <UAlert
            v-if="!setting"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Not configured yet"
            description="Fill in the form and save to create the first setting."
          />

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Provider" name="aiType" required>
              <USelect v-model="state.aiType" :items="aiTypeItems" value-key="value" class="w-full" />
            </UFormField>
            <UFormField label="Model" name="aiModel" required>
              <!-- Free text with native suggestions (datalist) filled by the download button -->
              <div class="flex gap-2">
                <UInput v-model="state.aiModel" class="w-full" list="ai-model-options" placeholder="e.g. gemini-2.5-flash" />
                <UTooltip text="Download available models">
                  <UButton
                    icon="i-lucide-download"
                    color="neutral"
                    variant="outline"
                    :loading="loadingModels"
                    aria-label="Download available models"
                    class="transition duration-200 active:scale-95"
                    @click="loadModels"
                  />
                </UTooltip>
              </div>
              <datalist id="ai-model-options">
                <option v-for="m in models" :key="m" :value="m" />
              </datalist>
            </UFormField>
          </div>

          <UFormField
            label="API key"
            name="apiKey"
            :required="!setting"
            :help="setting?.apiKeyMasked ? `Current key: ${setting.apiKeyMasked}. Leave empty to keep it.` : 'Stored encrypted on the server.'"
          >
            <UInput
              v-model="state.apiKey"
              class="w-full"
              :type="showKey ? 'text' : 'password'"
              autocomplete="off"
              placeholder="Paste a new API key"
            >
              <template #trailing>
                <UButton
                  :icon="showKey ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                  color="neutral"
                  variant="link"
                  size="xs"
                  :aria-label="showKey ? 'Hide API key' : 'Show API key'"
                  @click="showKey = !showKey"
                />
              </template>
            </UInput>
          </UFormField>
        </div>
      </UCard>

      <!-- Bean limits card -->
      <UCard class="motion-safe:animate-fade-up" style="--index: 2">
        <template #header>
          <div class="flex items-center gap-2 font-semibold text-highlighted">
            <UIcon name="i-lucide-coins" class="size-5 text-primary" />
            Bean limits
          </div>
        </template>

        <div class="space-y-4">
          <UFormField label="Daily bean limit" name="dailyBeanLimit" required help="Max beans a user can spend per day.">
            <UInputNumber v-model="state.dailyBeanLimit" :min="0" class="w-full" />
          </UFormField>
          <UFormField label="Beans per question" name="beanPerQuestion" required help="Cost of generating one question.">
            <UInputNumber v-model="state.beanPerQuestion" :min="0" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <!-- Footer: last update time and actions -->
      <div class="motion-safe:animate-fade-up flex flex-wrap items-center justify-between gap-3 lg:col-span-3" style="--index: 3">
        <span class="text-sm text-muted">
          <template v-if="setting">Last updated {{ formatDateTime(setting.updatedAt) }}</template>
        </span>
        <div class="flex gap-2">
          <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="reset">
            Reset
          </UButton>
          <UButton
            type="submit"
            icon="i-lucide-save"
            :loading="saving"
            class="transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          >
            Save settings
          </UButton>
        </div>
      </div>
    </UForm>
  </div>
</template>
