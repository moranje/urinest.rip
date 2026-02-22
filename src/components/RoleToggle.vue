<template>
  <div class="role-toggle" role="radiogroup" aria-label="Rol selectie">
    <button
      :class="['role-option', { active: role === 'behandelaar' }]"
      role="radio"
      :aria-checked="role === 'behandelaar'"
      @click="setRole('behandelaar')"
    >
      Arts
    </button>
    <button
      :class="['role-option', { active: role === 'triagist' }]"
      role="radio"
      :aria-checked="role === 'triagist'"
      @click="setRole('triagist')"
    >
      Triage
    </button>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useRoleStore } from '../store/roleStore'

const roleStore = useRoleStore()
const { role } = storeToRefs(roleStore)
const { setRole } = roleStore
</script>

<style scoped>
.role-toggle {
  display: flex;
  border-radius: var(--md-sys-shape-corner-full);
  border: 1px solid var(--md-sys-color-outline-variant);
  overflow: hidden;
  height: 32px;
}

.role-option {
  padding: 0 12px;
  border: none;
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-label-medium);
  cursor: pointer;
  transition: all var(--motion-duration-short) var(--motion-easing-standard);
  white-space: nowrap;
}

.role-option.active {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.role-option:not(.active):hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface-variant) 8%, transparent);
}

@media (hover: none) {
  .role-toggle {
    height: 44px;
  }
  .role-option {
    padding: 0 16px;
    min-width: 44px;
  }
}
</style>
