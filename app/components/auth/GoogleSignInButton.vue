<script setup lang="ts">
// Official Google Identity Services button. Emits the Google ID token (JWT) once the user picks an account.
// Renders nothing when no client id is configured (NUXT_PUBLIC_GOOGLE_CLIENT_ID).
const emit = defineEmits<{ credential: [idToken: string] }>()

const clientId = useRuntimeConfig().public.googleClientId as string
const container = ref<HTMLElement>()
const failed = ref(false)

const GSI_SRC = 'https://accounts.google.com/gsi/client'

interface GoogleId {
  initialize: (config: { client_id: string, callback: (res: { credential: string }) => void }) => void
  renderButton: (el: HTMLElement, options: Record<string, unknown>) => void
}
type GoogleWindow = Window & { google?: { accounts: { id: GoogleId } } }

// Load the GSI script once, even if the component mounts several times
function loadScript(): Promise<void> {
  if ((window as GoogleWindow).google?.accounts) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    const script = existing ?? Object.assign(document.createElement('script'), { src: GSI_SRC, async: true })
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('GSI load failed')), { once: true })
    if (!existing) document.head.appendChild(script)
  })
}

onMounted(async () => {
  if (!clientId || !container.value) return
  try {
    await loadScript()
    const gid = (window as GoogleWindow).google!.accounts.id
    gid.initialize({ client_id: clientId, callback: res => emit('credential', res.credential) })
    gid.renderButton(container.value, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'center',
      // The button needs a pixel width; fill the container (Google caps it at 400)
      width: Math.min(Math.round(container.value.clientWidth), 400)
    })
  } catch {
    failed.value = true
  }
})
</script>

<template>
  <div v-if="clientId" class="flex min-h-10 justify-center">
    <div ref="container" class="w-full" />
    <p v-if="failed" class="text-sm text-error">
      Không tải được đăng nhập Google. Vui lòng thử lại sau.
    </p>
  </div>
</template>
