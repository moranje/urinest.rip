import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Toast, ToastLevel, ToastOptions } from '../types'

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])
  let nextId = 1

  const defaultDurations: Record<ToastLevel, number> = {
    error: 8000,
    warning: 6000,
    success: 3000,
    info: 4000
  }

  function addToast(level: ToastLevel, message: string, opts: ToastOptions = {}): number {
    const id = nextId++
    const duration = opts.duration ?? defaultDurations[level]
    toasts.value = [...toasts.value, { id, level, message, dismissible: opts.dismissible ?? true }]

    if (duration > 0) {
      setTimeout(() => dismissToast(id), duration)
    }
    if (toasts.value.length > 5) {
      toasts.value = toasts.value.slice(-5)
    }
    return id
  }

  function dismissToast(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    addToast,
    dismissToast,
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    info: (msg: string) => addToast('info', msg)
  }
})
