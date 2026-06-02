<template>
  <div class="result-section result-section--title">
    <StatusBadge
      v-if="result.urgency"
      :variant="urgencyVariant"
      size="md"
      :pulse="urgencyVariant === 'u1'"
      :role="result.urgency.toLowerCase() === 'u1' ? 'status' : undefined"
      :aria-label="urgencyAriaLabel"
    >
      {{ result.urgency }}
    </StatusBadge>
    <h1 class="result-heading">{{ result.title }}</h1>
    <p v-if="result.description" class="result-description">
      {{ result.description }}
    </p>
  </div>

  <div v-if="result.additionalTests" class="result-section">
    <h3 class="section-title">Aanvullend Onderzoek</h3>
    <p>{{ result.additionalTests }}</p>
  </div>

  <slot name="after-additional" />

  <Notice v-if="result.warnings" variant="warning" title="Waarschuwing" role="alert">
    <p>{{ result.warnings }}</p>
  </Notice>

  <div v-if="result.testAfterTreatment" class="result-section">
    <h3 class="section-title">Vervolgonderzoek</h3>
    <p>{{ result.testAfterTreatment }}</p>
  </div>

  <Card v-if="result.explainer" class="result-section explainer-section" variant="plain">
    <h3 class="section-title">Leg uit aan patiënt</h3>
    <p>{{ result.explainer }}</p>
  </Card>

  <slot />

  <div v-if="result.sources && result.sources.length > 0" class="result-section">
    <h3 class="section-title">Bronnen</h3>
    <ul class="sources-list">
      <li v-for="(source, index) in result.sources" :key="index">
        <SourceChip :name="source.name" :url="source.url" />
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Notice from "../molecules/Notice.vue";
import SourceChip from "../molecules/SourceChip.vue";
import StatusBadge from "../molecules/StatusBadge.vue";
import Card from "../primitives/Card.vue";
import type { ResultData } from "../../types";

type UrgencyVariant = "u1" | "u2" | "u3" | "info";

const props = defineProps<{
  result: ResultData;
}>();

const urgencyAriaLabel = computed(() => {
  const urgency = props.result.urgency?.toLowerCase();
  if (urgency === "u1") return "Urgentie U1 - spoed";
  if (urgency === "u2") return "Urgentie U2 - binnen 24 uur";
  if (urgency === "u3") return "Urgentie U3 - niet-spoedeisend";
  return props.result.urgency ?? "";
});

const urgencyVariant = computed<UrgencyVariant>(() => {
  const urgency = props.result.urgency?.toLowerCase();
  if (urgency === "u1" || urgency === "u2" || urgency === "u3") return urgency;
  return "info";
});
</script>

<style scoped>
.result-section {
  padding: 0;
}

.result-section--title {
  background: none;
}

.section-title {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--md-sys-color-primary);
  font: var(--md-sys-typescale-title-medium);
}

.result-heading {
  margin-top: 0;
  margin-bottom: var(--spacing-sm);
  color: var(--md-sys-color-on-surface);
  font: var(--md-sys-typescale-headline-small);
}

.result-description {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
  font: var(--md-sys-typescale-body-large);
  line-height: 1.6;
  white-space: pre-wrap;
}

.result-section p {
  margin: 0;
  font: var(--md-sys-typescale-body-large);
  line-height: 1.6;
}

.explainer-section p {
  font: var(--md-sys-typescale-body-medium);
  line-height: 1.6;
  white-space: pre-wrap;
}

.sources-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  padding-left: 0;
  margin: 0;
  list-style: none;
}

@media (max-width: 599.98px) {
  .result-heading {
    font: var(--md-sys-typescale-title-large);
  }
}
</style>
