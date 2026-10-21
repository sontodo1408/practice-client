<script setup lang="ts">
// Global loading flag set by useApi through the app store
const appStore = useAppStore()
</script>

<template>
  <!-- UApp is required by Nuxt UI for toasts, modals and tooltips; toasts appear top-right -->
  <UApp :toaster="{ position: 'top-right' }">
    <NuxtRouteAnnouncer />
    <!-- Thin top bar shown while any API request is pending; fades in/out -->
    <Transition name="page">
      <UProgress
        v-if="appStore.isLoading"
        size="xs"
        aria-label="Loading"
        class="fixed inset-x-0 top-0 z-[100]"
      />
    </Transition>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <!-- Global dialog stack (see dialog-store) -->
    <AppDialogHost />
  </UApp>
</template>
