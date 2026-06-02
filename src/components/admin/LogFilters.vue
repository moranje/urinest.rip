<script setup lang="ts">
import type { LogFilters } from "../../store/logStore";
import Select, { type SelectOption } from "../primitives/Select.vue";

defineProps<{
  filters: LogFilters;
}>();

const emit = defineEmits<{
  change: [filters: Partial<LogFilters>];
}>();

const hourOptions: SelectOption[] = [
  { value: "1", label: "1 uur" },
  { value: "24", label: "24 uur" },
  { value: "168", label: "7 dagen" },
  { value: "720", label: "30 dagen" },
];

const levelOptions: SelectOption[] = [
  { value: "all", label: "Alle levels" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Waarschuwing" },
  { value: "error", label: "Error" },
];

const statusOptions: SelectOption[] = [
  { value: "open", label: "Open" },
  { value: "resolved", label: "Opgelost" },
  { value: "suppressed", label: "Onderdrukt" },
];
</script>

<template>
  <div class="log-filters">
    <Select
      id="filter-hours"
      class="log-filters__field"
      label="Periode"
      :model-value="String(filters.hours)"
      :options="hourOptions"
      @update:model-value="emit('change', { hours: Number($event) })"
    />
    <Select
      id="filter-level"
      class="log-filters__field"
      label="Level"
      :model-value="filters.level ?? 'all'"
      :options="levelOptions"
      @update:model-value="emit('change', { level: $event === 'all' ? null : $event })"
    />
    <Select
      id="filter-status"
      class="log-filters__field"
      label="Status"
      :model-value="filters.status"
      :options="statusOptions"
      @update:model-value="emit('change', { status: $event })"
    />
  </div>
</template>

<style scoped>
.log-filters {
  display: flex;
  gap: var(--spacing-md);
  align-items: end;
  flex-wrap: wrap;
}

.log-filters__field {
  min-width: 120px;
  flex: 1 1 10rem;
}
</style>
