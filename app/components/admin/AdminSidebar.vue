<script setup lang="ts">
// Sidebar content (logo + navigation); reused by the fixed desktop sidebar and the mobile slideover
defineEmits<{ navigate: [] }>()
</script>

<template>
  <div class="flex h-full flex-col">
    <!-- Brand block -->
    <NuxtLink to="/admin/subject" class="flex items-center gap-3 px-4 py-4" @click="$emit('navigate')">
      <img src="/logo.png" alt="Logo công ty" class="size-9 transition-transform duration-200 hover:scale-105">
      <span class="text-lg font-bold text-highlighted">Admin</span>
    </NuxtLink>

    <!-- Navigation; the active route is highlighted with the brand color -->
    <nav class="flex-1 overflow-y-auto px-3 py-2" aria-label="Điều hướng quản trị">
      <p class="mb-2 px-2 text-xs font-semibold tracking-wide text-muted uppercase">
        Quản lý
      </p>
      <UNavigationMenu
        orientation="vertical"
        :items="adminNavItems"
        color="primary"
        highlight
        @click="$emit('navigate')"
      />
    </nav>
  </div>
</template>
