<template>
  <div class="admin-template">
    <header class="admin-template__header">
      <h1>{{ title }}</h1>
      <div class="admin-template__actions">
        <Button variant="outlined" size="sm" @click="emit('signOut')">Uitloggen</Button>
      </div>
    </header>

    <AdminLogDetail
      v-if="selectedGroup"
      :group="selectedGroup"
      :events="events"
      :loading="loadingEvents"
      @back="emit('back')"
      @resolved="emit('resolved')"
    />

    <template v-else>
      <LogFilters :filters="filters" @change="emit('filtersChange', $event)" />

      <div v-if="sinkDownAt" class="admin-template__warning" role="status">
        <span>Log-persistentie is uitgeschakeld sinds {{ sinkDownAt }}.</span>
        <Button variant="outlined" size="sm" @click="emit('clearSinkStatus')">
          Markeer gezien
        </Button>
      </div>

      <div v-if="error" class="admin-template__error" role="alert">
        {{ error }}
      </div>

      <AdminLogList :groups="groups" :loading="loading" @select="emit('selectGroup', $event)" />
    </template>
  </div>
</template>

<script setup lang="ts">
import LogFilters from "../admin/LogFilters.vue";
import AdminLogDetail from "../organisms/AdminLogDetail.vue";
import AdminLogList from "../organisms/AdminLogList.vue";
import Button from "../primitives/Button.vue";
import type { LogEvent, LogFilters as LogFiltersType, LogGroup } from "../../store/logStore";

withDefaults(
  defineProps<{
    title?: string;
    groups: LogGroup[];
    events: LogEvent[];
    filters: LogFiltersType;
    loading: boolean;
    loadingEvents: boolean;
    selectedGroup?: LogGroup | null;
    sinkDownAt?: string | null;
    error?: string | null;
  }>(),
  {
    title: "Error Dashboard",
    selectedGroup: null,
    sinkDownAt: null,
    error: null,
  },
);

const emit = defineEmits<{
  signOut: [];
  selectGroup: [fingerprint: string];
  filtersChange: [filters: Partial<LogFiltersType>];
  clearSinkStatus: [];
  back: [];
  resolved: [];
}>();
</script>

<style scoped>
.admin-template {
  width: min(100% - var(--spacing-lg), var(--layout-content-max-width));
  margin: 0 auto;
  padding: var(--spacing-lg) 0;
  container-type: inline-size;
  container-name: admin;
}

.admin-template__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.admin-template__header h1 {
  margin: 0;
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-headline-small);
}

.admin-template__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.admin-template__error,
.admin-template__warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-md);
  margin: var(--spacing-md) 0;
  border-radius: var(--md-sys-shape-corner-small);
  font: var(--md-sys-typescale-body-small);
}

.admin-template__error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.admin-template__warning {
  background: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-on-warning-container);
}

@container admin (max-width: 37.5rem) {
  .admin-template {
    width: min(100% - var(--spacing-md), var(--layout-content-max-width));
    padding: var(--spacing-md) 0;
  }

  .admin-template__header,
  .admin-template__error,
  .admin-template__warning {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
