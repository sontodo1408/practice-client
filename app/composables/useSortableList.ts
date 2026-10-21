import type { Ref } from 'vue'
import type Sortable from 'sortablejs'

interface SortableListOptions {
  // CSS selector of the element that starts a drag (the grip icon)
  handle: string
  // Class added to the placeholder row while dragging
  ghostClass?: string
  // Called with the old and new index after a drop that changed the position
  onMove: (oldIndex: number, newIndex: number) => void
}

// Make the children of `container` drag-sortable with SortableJS (loaded in the browser only).
// SortableJS moves DOM nodes itself, so the move is undone here and the caller updates its data;
// Vue then re-renders the list in the new order and the DOM never drifts from the state.
export function useSortableList(container: Ref<HTMLElement | null>, options: SortableListOptions) {
  let instance: Sortable | null = null

  function destroy() {
    instance?.destroy()
    instance = null
  }

  // Re-create the instance whenever the container element (re)appears, e.g. after a v-if toggle
  watch(container, async (el) => {
    destroy()
    if (!el) return
    const { default: SortableJs } = await import('sortablejs')
    // The element may have changed or disappeared while the module was loading
    if (container.value !== el) return
    instance = SortableJs.create(el, {
      handle: options.handle,
      ghostClass: options.ghostClass,
      animation: 200,
      onEnd: ({ from, item, oldIndex, newIndex }) => {
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
        // Put the node back where Vue expects it before the state changes
        from.removeChild(item)
        from.insertBefore(item, from.children[oldIndex] ?? null)
        options.onMove(oldIndex, newIndex)
      }
    })
  }, { flush: 'post' })

  onBeforeUnmount(destroy)
}
