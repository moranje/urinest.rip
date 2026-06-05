<template>
  <Notice class="toast" :variant="noticeVariant" :role="noticeRole">
    <div class="toast__content">
      <Icon class="toast__icon" :name="iconName" :size="16" aria-hidden="true" />
      <span class="toast__message">{{ message }}</span>
      <IconButton
        v-if="dismissible"
        class="toast__close-action"
        data-testid="toast-close"
        icon="x"
        size="sm"
        aria-label="Melding sluiten"
        @click="$emit('dismiss')"
      />
    </div>
  </Notice>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ToastLevel } from "../../types";
import Notice from "./Notice.vue";
import Icon from "../primitives/Icon.vue";
import IconButton from "../primitives/IconButton.vue";

defineOptions({
  name: "UiToast",
});

const props = withDefaults(
  defineProps<{
    level?: ToastLevel;
    message: string;
    dismissible?: boolean;
  }>(),
  {
    level: "info",
    dismissible: true,
  },
);

defineEmits<{
  dismiss: [];
}>();

const noticeVariant = computed(() => props.level);
const noticeRole = computed(() => (props.level === "error" ? "alert" : "status"));
const iconName = computed(() => {
  if (props.level === "success") return "check-circle";
  if (props.level === "error") return "warning-circle";
  if (props.level === "warning") return "warning-triangle";
  return "info-circle";
});
</script>

<style scoped>
.toast {
  --notice-accent-width: 3px;
  --notice-padding-block: var(--spacing-md);
  --notice-padding-inline: var(--spacing-md);

  inline-size: 100%;
  pointer-events: auto;
  box-shadow: var(--md-sys-elevation-3);
}

.toast :deep(.notice__body) {
  font: var(--md-sys-typescale-body-medium);
}

.toast__content {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  min-inline-size: 0;
}

.toast__icon {
  flex-shrink: 0;
  color: var(--notice-accent);
}

.toast__message {
  flex: 1;
  min-inline-size: 0;
  overflow-wrap: anywhere;
  text-wrap: pretty;
}

.toast__close-action {
  flex-shrink: 0;
  color: inherit;
}
</style>
