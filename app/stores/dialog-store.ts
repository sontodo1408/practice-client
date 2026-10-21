import { markRaw } from 'vue'
import type {
  ConfirmDialogOptions,
  ContentDialogOptions,
  DialogItem,
  MessageDialogOptions
} from '~/types/dialog'

// Promise resolvers live outside the state so the store stays serializable
const resolvers = new Map<number, (result: unknown) => void>()
let nextId = 1

// Stack of open dialogs; several can be open at once (last one is on top)
export const useDialogStore = defineStore('dialog', () => {
  const dialogs = ref<DialogItem[]>([])

  // Push a dialog and return a promise that settles when it is closed
  function open<T>(item: Omit<DialogItem, 'id'>): Promise<T> {
    const id = nextId++
    dialogs.value.push({ ...item, id } as DialogItem)
    return new Promise<T>((resolve) => {
      resolvers.set(id, resolve as (result: unknown) => void)
    })
  }

  // Close one dialog by id and resolve its promise with the given result
  function close(id: number, result?: unknown) {
    const item = dialogs.value.find(d => d.id === id)
    if (!item) return
    dialogs.value = dialogs.value.filter(d => d.id !== id)
    // Dismissing a confirm dialog counts as "cancel"
    resolvers.get(id)?.(result ?? (item.type === 'confirm' ? false : undefined))
    resolvers.delete(id)
  }

  // Info/error dialog with a single close button
  function message(options: MessageDialogOptions) {
    return open<void>({ type: 'message', ...options })
  }

  // Two-button dialog; resolves to true when confirmed
  function confirm(options: ConfirmDialogOptions) {
    return open<boolean>({ type: 'confirm', ...options })
  }

  // Dialog hosting a child component; the child calls emit('close', result) to resolve
  function content<T = unknown>(options: ContentDialogOptions) {
    return open<T | undefined>({ type: 'content', ...options, component: markRaw(options.component) })
  }

  return { dialogs, message, confirm, content, close }
})
