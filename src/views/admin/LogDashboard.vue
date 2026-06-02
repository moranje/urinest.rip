<script setup lang="ts">
import { onMounted, onUnmounted, watch } from "vue";
import { useLogStore } from "../../store/logStore";
import { useAuthStore } from "../../store/authStore";
import { useRouter } from "vue-router";
import AdminTemplate from "../../components/templates/AdminTemplate.vue";
import type { LogFilters as LogFiltersType } from "../../store/logStore";

const logStore = useLogStore();
const authStore = useAuthStore();
const router = useRouter();

function handleSelectGroup(fingerprint: string) {
  logStore.loadEvents(fingerprint);
}

function handleBack() {
  logStore.selectGroup(null);
}

function handleFiltersChange(f: Partial<LogFiltersType>) {
  logStore.setFilters(f);
  logStore.loadGroups();
}

function handleResolved() {
  logStore.selectGroup(null);
  logStore.loadGroups();
}

function handleSignOut() {
  authStore.signOut();
  router.push("/admin/login");
}

const selectedGroup = () => {
  return logStore.groups.find((g) => g.fingerprint === logStore.selectedFingerprint) ?? null;
};

onMounted(() => {
  logStore.refreshSinkStatus();
  logStore.loadGroups();
  logStore.startAutoRefresh();
});

onUnmounted(() => {
  logStore.stopAutoRefresh();
});

watch(
  () => logStore.filters,
  () => {
    logStore.loadGroups();
  },
  { deep: true },
);
</script>

<template>
  <AdminTemplate
    :groups="logStore.groups"
    :events="logStore.events"
    :filters="logStore.filters"
    :loading="logStore.loading"
    :loading-events="logStore.loadingEvents"
    :selected-group="logStore.selectedFingerprint ? selectedGroup() : null"
    :sink-down-at="logStore.sinkDownAt"
    :error="logStore.error"
    @sign-out="handleSignOut"
    @select-group="handleSelectGroup"
    @filters-change="handleFiltersChange"
    @clear-sink-status="logStore.clearSinkStatus()"
    @back="handleBack"
    @resolved="handleResolved"
  />
</template>
