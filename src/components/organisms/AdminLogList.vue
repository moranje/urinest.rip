<script setup lang="ts">
import Icon from "../primitives/Icon.vue";
import StatusBadge from "../molecules/StatusBadge.vue";
import type { LogGroup } from "../../store/logStore";

defineProps<{
  groups: LogGroup[];
  loading: boolean;
}>();

const emit = defineEmits<{
  select: [fingerprint: string];
}>();

function levelBadgeVariant(level: string): "error" | "info" | "warn" {
  if (level === "error") return "error";
  if (level === "info") return "info";
  return "warn";
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "zojuist";
  if (diffMin < 60) return `${diffMin} min geleden`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} uur geleden`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "gisteren";
  return `${diffD} dagen geleden`;
}
</script>

<template>
  <div v-if="loading" class="loading-state">
    <div class="spinner" />
    <span>Logs laden...</span>
  </div>

  <div v-else-if="groups.length === 0" class="empty-state">
    <Icon name="activity" :size="32" />
    <p>Geen errors gevonden in deze periode</p>
  </div>

  <div v-else class="group-list">
    <button
      v-for="group in groups"
      :key="group.fingerprint"
      class="group-row"
      @click="emit('select', group.fingerprint)"
    >
      <div class="group-header">
        <StatusBadge :variant="levelBadgeVariant(group.level)">
          {{ group.level.toUpperCase() }}
        </StatusBadge>
        <StatusBadge
          v-if="group.status === 'resolved'"
          variant="resolved"
          :title="`Opgelost in ${group.resolved_in_version ?? '?'}`"
        >
          Opgelost
        </StatusBadge>
        <StatusBadge v-else-if="group.status === 'suppressed'" variant="suppressed">
          Onderdrukt
        </StatusBadge>
        <span class="group-module">{{ group.module }}</span>
        <span class="group-message">{{ group.message }}</span>
        <span class="group-count" :title="`${group.count} events`">&times;{{ group.count }}</span>
      </div>
      <div class="group-meta">
        <span>Laatst: {{ timeAgo(group.last_seen) }}</span>
        <span class="meta-dot">&middot;</span>
        <span>Eerst: {{ timeAgo(group.first_seen) }}</span>
      </div>
    </button>
  </div>
</template>

<style scoped>
.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xl);
  color: var(--md-sys-color-outline);
  text-align: center;
}

.empty-state p {
  font: var(--md-sys-typescale-body-small);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--md-sys-color-outline-variant);
  border-top-color: var(--md-sys-color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.group-list {
  display: flex;
  flex-direction: column;
}

.group-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-lowest);
  cursor: pointer;
  text-align: left;
  transition: background var(--motion-duration-short) var(--motion-easing-standard);
}

.group-row:first-child {
  border-radius: var(--md-sys-shape-corner-small) var(--md-sys-shape-corner-small) 0 0;
}

.group-row:last-child {
  border-bottom: none;
  border-radius: 0 0 var(--md-sys-shape-corner-small) var(--md-sys-shape-corner-small);
}

.group-row:only-child {
  border-radius: var(--md-sys-shape-corner-small);
}

.group-row:hover {
  background: var(--md-sys-color-surface-container);
}

.group-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
}

.group-module {
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-label-small);
}

.group-message {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-body-small);
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-count {
  flex-shrink: 0;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-small);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.group-meta {
  padding-left: calc(var(--spacing-sm) + 3ch + var(--spacing-xs) + var(--spacing-sm));
  color: var(--md-sys-color-outline);
  font: var(--md-sys-typescale-label-small);
}

.meta-dot {
  margin: 0 var(--spacing-xs);
}

@media (max-width: 599.98px) {
  .group-row {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .group-meta {
    padding-left: 0;
  }
}
</style>
