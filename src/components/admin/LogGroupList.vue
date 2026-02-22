<script setup lang="ts">
import type { LogGroup } from '../../store/logStore'

defineProps<{
  groups: LogGroup[]
  loading: boolean
}>()

const emit = defineEmits<{
  select: [fingerprint: string]
}>()

function levelBadgeClass(level: string): string {
  if (level === 'error') return 'badge-error'
  return 'badge-warn'
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'zojuist'
  if (diffMin < 60) return `${diffMin} min geleden`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `${diffH} uur geleden`
  const diffD = Math.floor(diffH / 24)
  if (diffD === 1) return 'gisteren'
  return `${diffD} dagen geleden`
}
</script>

<template>
  <div v-if="loading" class="loading-state">
    <div class="spinner" />
    <span>Logs laden...</span>
  </div>

  <div v-else-if="groups.length === 0" class="empty-state">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
    <p>Geen errors gevonden in deze periode</p>
  </div>

  <div v-else class="group-list">
    <button v-for="group in groups" :key="group.fingerprint" class="group-row" @click="emit('select', group.fingerprint)">
      <div class="group-header">
        <span :class="['level-badge', levelBadgeClass(group.level)]">{{ group.level.toUpperCase() }}</span>
        <span v-if="group.status === 'resolved'" class="status-badge status-resolved" :title="`Opgelost in ${group.resolved_in_version ?? '?'}`">Opgelost</span>
        <span v-else-if="group.status === 'suppressed'" class="status-badge status-suppressed">Onderdrukt</span>
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
.loading-state, .empty-state {
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
  to { transform: rotate(360deg); }
}

.group-list {
  display: flex;
  flex-direction: column;
}

.group-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding: var(--spacing-md) var(--spacing-lg);
  border: none;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  background: var(--md-sys-color-surface-container-lowest);
  cursor: pointer;
  text-align: left;
  width: 100%;
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
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.level-badge {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  padding: 2px var(--spacing-xs);
  border-radius: var(--md-sys-shape-corner-extra-small);
  flex-shrink: 0;
}

.badge-error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-error);
}

.badge-warn {
  background: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-on-warning-container);
}

.status-badge {
  font-size: 0.625rem;
  font-weight: 600;
  padding: 1px var(--spacing-xs);
  border-radius: var(--md-sys-shape-corner-extra-small);
  flex-shrink: 0;
}

.status-resolved {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-primary);
}

.status-suppressed {
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-outline);
}

.group-module {
  font: var(--md-sys-typescale-label-small);
  color: var(--md-sys-color-on-surface-variant);
}

.group-message {
  font: var(--md-sys-typescale-body-small);
  font-weight: 500;
  color: var(--md-sys-color-on-surface);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.group-count {
  font: var(--md-sys-typescale-body-small);
  font-weight: 600;
  color: var(--md-sys-color-on-surface-variant);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.group-meta {
  font: var(--md-sys-typescale-label-small);
  color: var(--md-sys-color-outline);
  padding-left: calc(var(--spacing-sm) + 3ch + var(--spacing-xs) + var(--spacing-sm));
}

.meta-dot {
  margin: 0 var(--spacing-xs);
}

@media (max-width: 640px) {
  .group-row {
    padding: var(--spacing-sm) var(--spacing-md);
  }

  .group-meta {
    padding-left: 0;
  }
}
</style>
