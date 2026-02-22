import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserRole } from '../types'

const STORAGE_KEY = 'urinest-role'

export const useRoleStore = defineStore('role', () => {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  const role = ref<UserRole>(stored === 'triagist' ? 'triagist' : 'behandelaar')

  const setRole = (newRole: UserRole): void => {
    role.value = newRole
    localStorage.setItem(STORAGE_KEY, newRole)
  }

  const toggleRole = (): void => {
    setRole(role.value === 'behandelaar' ? 'triagist' : 'behandelaar')
  }

  return { role, setRole, toggleRole }
})
