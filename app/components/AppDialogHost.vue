<script setup lang="ts">
// Renders every dialog in the dialog store; mounted once in app.vue
const dialogStore = useDialogStore()

// Closing via overlay/Esc resolves the dialog without a result
function onOpenChange(id: number, open: boolean) {
  if (!open) dialogStore.close(id)
}
</script>

<template>
  <!-- One modal per stacked dialog; Nuxt UI handles enter/leave animation.
       No "X" button (:close="false"); a divider separates the title from the content. -->
  <UModal
    v-for="dialog in dialogStore.dialogs"
    :key="dialog.id"
    :open="true"
    :title="dialog.title"
    :close="false"
    :ui="{ header: 'border-b border-default', content: dialog.type === 'content' ? dialog.widthClass : undefined }"
    @update:open="onOpenChange(dialog.id, $event)"
  >
    <!-- "content" dialogs: only the child component (it emits "close" with a result) -->
    <template v-if="dialog.type === 'content'" #body>
      <component
        :is="dialog.component"
        v-bind="dialog.props"
        @close="dialogStore.close(dialog.id, $event)"
      />
    </template>

    <!-- "message" / "confirm" dialogs: optional description text -->
    <template v-else-if="dialog.description" #body>
      <p class="whitespace-pre-line text-sm text-muted">
        {{ dialog.description }}
      </p>
    </template>

    <!-- Right-aligned close button for "message" dialogs -->
    <template v-if="dialog.type === 'message'" #footer>
      <div class="flex w-full justify-end">
        <UButton class="transition duration-200 active:scale-95" @click="dialogStore.close(dialog.id)">
          {{ dialog.closeText ?? 'Đóng' }}
        </UButton>
      </div>
    </template>

    <!-- Right-aligned cancel + confirm buttons for "confirm" dialogs -->
    <template v-else-if="dialog.type === 'confirm'" #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="outline"
          class="transition duration-200 active:scale-95"
          @click="dialogStore.close(dialog.id, false)"
        >
          {{ dialog.cancelText ?? 'Hủy' }}
        </UButton>
        <UButton
          :color="dialog.confirmColor ?? 'primary'"
          class="transition duration-200 active:scale-95"
          @click="dialogStore.close(dialog.id, true)"
        >
          {{ dialog.confirmText ?? 'Xác nhận' }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
