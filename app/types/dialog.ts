import type { Component } from 'vue'

// Visual style of the confirm button
export type DialogColor = 'primary' | 'error' | 'warning' | 'success' | 'neutral'

// Fields shared by every dialog kind
interface DialogBase {
  title: string
}

// Description text, only for dialogs that show a plain message
interface DescribedDialogBase extends DialogBase {
  description?: string
}

// "message": one close button
export interface MessageDialogOptions extends DescribedDialogBase {
  closeText?: string
}

// "confirm": confirm + cancel buttons, resolves to true/false
export interface ConfirmDialogOptions extends DescribedDialogBase {
  confirmText?: string
  cancelText?: string
  // Use 'error' for destructive actions
  confirmColor?: DialogColor
}

// "content": title + custom child component only (no description, no footer buttons)
export interface ContentDialogOptions extends DialogBase {
  component: Component
  // Props passed to the child component
  props?: Record<string, unknown>
}

// Dialog entry kept in the stack (last item is the top-most dialog)
export type DialogItem =
  | ({ id: number, type: 'message' } & MessageDialogOptions)
  | ({ id: number, type: 'confirm' } & ConfirmDialogOptions)
  | ({ id: number, type: 'content' } & ContentDialogOptions)
