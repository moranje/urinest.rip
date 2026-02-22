<script setup lang="ts">
import type { LogFilters } from '../../store/logStore'

defineProps<{
  filters: LogFilters
}>()

const emit = defineEmits<{
  change: [filters: Partial<LogFilters>]
}>()
</script>

<template>
  <div class="log-filters">
    <div class="filter-group">
      <label for="filter-hours">Periode</label>
      <select id="filter-hours" :value="filters.hours" @change="emit('change', { hours: Number(($event.target as HTMLSelectElement).value) })">
        <option :value="1">1 uur</option>
        <option :value="24">24 uur</option>
        <option :value="168">7 dagen</option>
        <option :value="720">30 dagen</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="filter-level">Level</label>
      <select id="filter-level" :value="filters.level ?? 'warn'" @change="emit('change', { level: ($event.target as HTMLSelectElement).value })">
        <option value="warn">Alle (warn+)</option>
        <option value="error">Error+</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="filter-status">Status</label>
      <select id="filter-status" :value="filters.status" @change="emit('change', { status: ($event.target as HTMLSelectElement).value })">
        <option value="open">Open</option>
        <option value="resolved">Opgelost</option>
        <option value="suppressed">Onderdrukt</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.log-filters {
  display: flex;
  gap: var(--spacing-md);
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

label {
  font: var(--md-sys-typescale-label-small);
  color: var(--md-sys-color-outline);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

select {
  min-width: 120px;
  padding: var(--spacing-xs) var(--spacing-sm);
  font: var(--md-sys-typescale-body-small);
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
}
</style>
