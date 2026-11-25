<script setup lang="ts">
import type { AdminUser } from '~/types/adminUser'

// Popup content: shows a user's info and lets the admin pick a daily bean limit plan.
// Emits "close" with true after a successful save.
const props = defineProps<{ user: AdminUser }>()
const emit = defineEmits<{ close: [saved?: boolean] }>()

const userApi = useAdminUserApi()

// Available plans; 30 is the default plan
const planItems = [
  { label: '30 bean / ngày (mặc định)', value: 30 },
  { label: '200 bean / ngày', value: 200 },
  { label: '500 bean / ngày', value: 500 },
  { label: '2000 bean / ngày', value: 2000 }
]

// Preselect the current limit when it matches a plan, otherwise the default plan
const beanLimit = ref<number>(
  planItems.some(p => p.value === props.user.dailyLimitBean) ? props.user.dailyLimitBean! : 30
)
const saving = ref(false)

// Best available display name for the user
const displayName = computed(() => {
  const u = props.user
  return u.displayName || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username
})

// Read-only info rows shown above the form
const infoRows = computed(() => [
  { label: 'Tên đăng nhập', value: props.user.username },
  { label: 'Email', value: props.user.email },
  { label: 'Điện thoại', value: props.user.phone },
  { label: 'Bean còn lại', value: String(props.user.remainingBean ?? 0) },
  { label: 'Giới hạn hiện tại', value: String(props.user.dailyLimitBean ?? 0) }
])

// Save the chosen limit; API errors are shown by the global dialog, so we only stop the spinner
async function onSave() {
  saving.value = true
  try {
    await userApi.updateBeanLimit(props.user.userId, beanLimit.value)
    emit('close', true)
  } catch (e) {
    if (!(e instanceof ApiError)) throw e
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- User summary -->
    <div class="flex items-center gap-3">
      <UAvatar :src="user.avatarUrl || undefined" :alt="displayName" size="lg" />
      <div class="min-w-0">
        <p class="truncate font-semibold text-highlighted">
          {{ displayName }}
        </p>
        <p class="truncate text-sm text-muted">
          @{{ user.username }}
        </p>
      </div>
    </div>

    <dl class="grid grid-cols-1 gap-x-4 gap-y-2 rounded-lg border border-default bg-elevated/50 p-3 text-sm sm:grid-cols-2">
      <div v-for="row in infoRows" :key="row.label">
        <dt class="text-xs text-muted">
          {{ row.label }}
        </dt>
        <dd class="truncate text-highlighted">
          {{ row.value || '—' }}
        </dd>
      </div>
    </dl>

    <!-- Plan picker -->
    <UFormField label="Gói bean limit" name="beanLimit">
      <USelect v-model="beanLimit" :items="planItems" value-key="value" class="w-full" />
    </UFormField>

    <!-- Actions -->
    <div class="flex justify-end gap-2">
      <UButton color="neutral" variant="outline" class="transition duration-200 active:scale-95" @click="emit('close')">
        Hủy
      </UButton>
      <UButton icon="i-lucide-save" :loading="saving" class="transition duration-200 active:scale-95" @click="onSave">
        Lưu
      </UButton>
    </div>
  </div>
</template>
