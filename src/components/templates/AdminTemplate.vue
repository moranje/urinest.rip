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
      @close-detail="emit('closeDetail')"
      @resolved="emit('resolved')"
    />

    <template v-else>
      <LogFilters :filters="filters" @change="emit('filtersChange', $event)" />

      <Notice v-if="sinkDownAt" class="admin-template__warning" variant="warning" role="status">
        <span>Log-persistentie is uitgeschakeld sinds {{ sinkDownAt }}.</span>
        <template #action>
          <Button variant="outlined" size="sm" @click="emit('clearSinkStatus')">
            Markeer gezien
          </Button>
        </template>
      </Notice>

      <Notice v-if="error" class="admin-template__error" variant="error" role="alert">
        {{ error }}
      </Notice>

      <AdminLogList :groups="groups" :loading="loading" @select="emit('selectGroup', $event)" />
    </template>
  </div>
</template>

<script setup lang="ts">
import LogFilters from "../admin/LogFilters.vue";
import Notice from "../molecules/Notice.vue";
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
  closeDetail: [];
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

.admin-template__warning,
.admin-template__error {
  margin: var(--spacing-md) 0;
}

@container admin (max-width: 37.5rem) {
  .admin-template {
    width: min(100% - var(--spacing-md), var(--layout-content-max-width));
    padding: var(--spacing-md) 0;
  }

  .admin-template__header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
