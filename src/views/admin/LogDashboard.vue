<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useLogStore } from '../../store/logStore'
import { useAuthStore } from '../../store/authStore'
import { useRouter } from 'vue-router'
import LogGroupList from '../../components/admin/LogGroupList.vue'
import LogDetail from '../../components/admin/LogDetail.vue'
import LogFilters from '../../components/admin/LogFilters.vue'
import type { LogFilters as LogFiltersType } from '../../store/logStore'

const logStore = useLogStore()
const authStore = useAuthStore()
const router = useRouter()

function handleSelectGroup(fingerprint: string) {
  logStore.loadEvents(fingerprint)
}

function handleBack() {
  logStore.selectGroup(null)
}

function handleFiltersChange(f: Partial<LogFiltersType>) {
  logStore.setFilters(f)
  logStore.loadGroups()
}

function handleResolved() {
  logStore.selectGroup(null)
  logStore.loadGroups()
}

function handleSignOut() {
  authStore.signOut()
  router.push('/admin/login')
}

const selectedGroup = () => {
  return logStore.groups.find((g) => g.fingerprint === logStore.selectedFingerprint) ?? null
}

onMounted(() => {
  logStore.loadGroups()
  logStore.startAutoRefresh()
})

onUnmounted(() => {
  logStore.stopAutoRefresh()
})

watch(() => logStore.filters, () => {
  logStore.loadGroups()
}, { deep: true })
</script>

<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h1>Error Dashboard</h1>
      <div class="header-actions">
        <button class="signout-btn" @click="handleSignOut">Uitloggen</button>
      </div>
    </div>

    <template v-if="logStore.selectedFingerprint && selectedGroup()">
      <LogDetail
        :group="selectedGroup()!"
        :events="logStore.events"
        :loading="logStore.loadingEvents"
        @back="handleBack"
        @resolved="handleResolved"
      />
    </template>

    <template v-else>
      <LogFilters :filters="logStore.filters" @change="handleFiltersChange" />

      <div v-if="logStore.error" class="error-banner">
        {{ logStore.error }}
      </div>

      <LogGroupList
        :groups="logStore.groups"
        :loading="logStore.loading"
        @select="handleSelectGroup"
      />
    </template>
  </div>
</template>

<style scoped>
.dashboard {
  max-width: 900px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

h1 {
  font: var(--md-sys-typescale-headline-small);
  color: var(--md-sys-color-on-surface);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.signout-btn {
  font: var(--md-sys-typescale-label-large);
  color: var(--md-sys-color-outline);
  background: none;
  border: 1px solid var(--md-sys-color-outline-variant);
  border-radius: var(--md-sys-shape-corner-small);
  padding: var(--spacing-xs) var(--spacing-md);
  cursor: pointer;
}

.signout-btn:hover {
  background: var(--md-sys-color-surface-container);
}

.error-banner {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--md-sys-shape-corner-small);
  font: var(--md-sys-typescale-body-small);
  margin: var(--spacing-md) 0;
}
</style>
