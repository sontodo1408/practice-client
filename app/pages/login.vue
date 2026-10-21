<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'
import type { LoginPayload } from '~/types/auth'

// Use the centered auth layout
definePageMeta({ layout: 'auth' })
useSeoMeta({ title: 'Sign in' })

const { login } = useAuth()
const route = useRoute()

const state = reactive<LoginPayload>({ username: '', password: '' })

// Validation rules; messages are shown inline under each field
function validate(values: Partial<LoginPayload>): FormError[] {
  const errors: FormError[] = []
  if (!values.username?.trim()) {
    errors.push({ name: 'username', message: 'Please enter your username' })
  }
  if (!values.password) {
    errors.push({ name: 'password', message: 'Please enter your password' })
  }
  return errors
}
const showPassword = ref(false)
const loading = ref(false)
// The form is server-rendered; before hydration Enter would submit it natively (page reload, cleared inputs).
// A disabled submit button blocks that implicit submission until the Vue handlers are attached.
const hydrated = ref(false)
onMounted(() => { hydrated.value = true })

// Text typed into the server-rendered inputs before hydration would be wiped when v-model applies the empty
// state; copy it into the state first so slow hydration doesn't lose what the user already typed.
const nuxtApp = useNuxtApp()
onBeforeMount(() => {
  if (!nuxtApp.isHydrating) return
  const username = document.querySelector<HTMLInputElement>('input[autocomplete="username"]')
  const password = document.querySelector<HTMLInputElement>('input[autocomplete="current-password"]')
  if (username?.value) state.username = username.value
  if (password?.value) state.password = password.value
})

// Submit handler: errors are shown by the global API error dialog, success message by a toast
async function onSubmit(event: FormSubmitEvent<LoginPayload>) {
  loading.value = true
  try {
    await login(event.data)
    // Go back to the screen the user was on before being sent here (falls back to home)
    await navigateTo(safeRedirect(route.query.redirect))
  } catch (e) {
    // Only ApiError is expected (already displayed); rethrow anything else
    if (!(e instanceof ApiError)) throw e
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="motion-safe:animate-fade-up">
    <!-- Brand header -->
    <div class="mb-6 text-center">
      <img
        src="/logo.png"
        alt="Company logo"
        class="mx-auto mb-4 size-16 drop-shadow-lg transition-transform duration-200 hover:scale-105"
      >
      <h1 class="text-2xl font-bold text-highlighted">
        Welcome back
      </h1>
      <p class="mt-1 text-sm text-muted">
        Sign in to continue to your account
      </p>
    </div>

    <UCard class="shadow-xl" :ui="{ body: 'p-6 sm:p-8' }">
      <!-- Login form with inline validation -->
      <UForm :validate="validate" :state="state" class="space-y-5" @submit="onSubmit">
        <UFormField label="Username" name="username"class="motion-safe:animate-fade-up" style="--index: 1">
          <UInput
            v-model="state.username"
            placeholder="Your username"
            icon="i-lucide-user"
            autocomplete="username"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Password" name="password" class="motion-safe:animate-fade-up" style="--index: 2">
          <UInput
            v-model="state.password"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            icon="i-lucide-lock"
            autocomplete="current-password"
            size="lg"
            class="w-full"
            :ui="{ trailing: 'pe-1' }"
          >
            <!-- Toggle password visibility -->
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </UFormField>

        <!-- Primary action with hover/active feedback -->
        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="!hydrated"
          class="motion-safe:animate-fade-up transition duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          style="--index: 3"
        >
          Sign in
        </UButton>
      </UForm>
    </UCard>
  </div>
</template>
