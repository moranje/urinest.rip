<template>
  <Button
    type="button"
    class="copy-action"
    :class="`copy-action--${state}`"
    :variant="variant"
    :size="size"
    :disabled="isDisabled"
    :loading="state === 'copying'"
    :aria-label="currentLabel"
    @click="copy"
  >
    <template #leading>
      <Icon name="copy" :size="iconSize" />
    </template>
    {{ currentLabel }}
  </Button>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref } from "vue";
import Button from "../primitives/Button.vue";
import Icon from "../primitives/Icon.vue";

type CopyState = "idle" | "copying" | "copied" | "error";
type ButtonVariant = InstanceType<typeof Button>["$props"]["variant"];
type ButtonSize = InstanceType<typeof Button>["$props"]["size"];

const props = withDefaults(
  defineProps<{
    text: string;
    label?: string;
    copyingLabel?: string;
    copiedLabel?: string;
    errorLabel?: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    resetDelay?: number;
  }>(),
  {
    label: "Kopieer",
    copyingLabel: "Kopiëren...",
    copiedLabel: "Gekopieerd",
    errorLabel: "Niet gekopieerd",
    variant: "outlined",
    size: "md",
    disabled: false,
    resetDelay: 1500,
  },
);

const emit = defineEmits<{
  copied: [];
  error: [error: unknown];
}>();

const state = ref<CopyState>("idle");
let resetTimer: ReturnType<typeof setTimeout> | null = null;

const currentLabel = computed(() => {
  if (state.value === "copying") return props.copyingLabel;
  if (state.value === "copied") return props.copiedLabel;
  if (state.value === "error") return props.errorLabel;
  return props.label;
});

const isDisabled = computed(() => props.disabled || state.value === "copying" || !props.text);
const iconSize = computed(() => (props.size === "sm" ? 14 : 16));

function scheduleReset(): void {
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    state.value = "idle";
  }, props.resetDelay);
}

async function copy(): Promise<void> {
  if (isDisabled.value) return;

  state.value = "copying";
  try {
    await navigator.clipboard.writeText(props.text);
    state.value = "copied";
    emit("copied");
  } catch (error) {
    state.value = "error";
    emit("error", error);
  } finally {
    scheduleReset();
  }
}

onUnmounted(() => {
  if (resetTimer) clearTimeout(resetTimer);
});
</script>

<style scoped>
.copy-action {
  flex-shrink: 0;
}

.copy-action--copying {
  cursor: progress;
}

.copy-action--copied {
  border-color: var(--md-sys-color-primary);
  color: var(--md-sys-color-primary);
}

.copy-action--error {
  border-color: var(--md-sys-color-error);
  color: var(--md-sys-color-error);
}
</style>
