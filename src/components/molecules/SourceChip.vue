<template>
  <Chip
    class="source-chip"
    :class="url ? 'source-chip--link' : 'source-chip--text'"
    :href="url"
    :variant="url ? 'outlined' : 'filled'"
    icon="file-text"
  >
    {{ name }}
  </Chip>
</template>

<script setup lang="ts">
import Chip from "../primitives/Chip.vue";

defineProps<{
  name: string;
  url?: string;
}>();
</script>
