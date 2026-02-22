/**
 * Standalone toast helpers for use from plain TypeScript modules.
 * Accesses the Pinia toast store via getActivePinia().
 */

import { getActivePinia } from 'pinia'
import { useToastStore } from '../store/toastStore'

export function toastError(msg: string): void {
  const pinia = getActivePinia()
  if (!pinia) return
  useToastStore(pinia).error(msg)
}

export function toastWarning(msg: string): void {
  const pinia = getActivePinia()
  if (!pinia) return
  useToastStore(pinia).warning(msg)
}
