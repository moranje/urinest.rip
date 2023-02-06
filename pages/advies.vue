<script lang="ts" setup>
  import { useStore } from '@/store/store';
  import Text from '@/components/Text.vue';
  import Items from '@/components/Items.vue';

  useHead({
    titleTemplate: 'Behandeladvies - urinest.rip',
  });

  const store = useStore();
  const edit = ref(false);
  let copied = ref(false);

  const devModeEdit = computed(() => {
    return process.dev && edit.value;
  });

  function copy() {
    navigator.clipboard.writeText(store.getTreatmentOption.documentation).then(
      () => (copied.value = true),
      () => console.error('Copy failed')
    );
  }
</script>

<template>
  <div class="vff vff-not-standalone">
    <div class="f-container">
      <div class="f-form-wrap">
        <div class="vff-animate f-fade-in-up">
          <button
            type="button"
            @click="edit = !edit"
            class="o-btn-action float-right"
          >
            <ion-icon name="create-outline"></ion-icon>
          </button>

          <button type="button" @click="copy" class="o-btn-action float-right">
            <ion-icon name="copy-outline"></ion-icon>
          </button>

          <h2 class="upper">Checklist</h2>

          <ClientOnly>
            <div class="grid">
              <h3
                v-if="store.getTreatmentOption.additionalTest"
                class="grid-item item-name"
              >
                Onderzoek
              </h3>
              <Text
                v-if="store.getTreatmentOption.additionalTest"
                :text="store.getTreatmentOption.additionalTest"
                @blur="store.setTreatmentOption"
                @change="store.setTreatmentOption"
                :editable="devModeEdit"
                name="additionalTest"
                class="grid-item"
              />

              <h3
                v-if="store.getTreatmentOption.description"
                class="grid-item item-name"
              >
                Behandel
              </h3>
              <Text
                :text="store.getTreatmentOption.description"
                @blur="store.setTreatmentOption"
                @change="store.setTreatmentOption"
                :editable="devModeEdit"
                name="description"
                class="grid-item"
              />

              <h3
                v-if="store.getTreatmentOption.contraIndications != null"
                class="grid-item item-name"
              >
                Contra-indicaties
              </h3>
              <Items
                v-if="store.getTreatmentOption.contraIndications != null"
                :items="store.getTreatmentOption.contraIndications ?? []"
                @blur="store.setTreatmentOption"
                @change="store.setTreatmentOption"
                :editable="devModeEdit"
                name="contraIndications"
                class="grid-item danger"
              />

              <h3
                v-if="store.getTreatmentOption.info"
                class="grid-item item-name"
              >
                Waarschuwingen
              </h3>
              <Text
                v-if="store.getTreatmentOption.info"
                :text="store.getTreatmentOption.info"
                @blur="store.setTreatmentOption"
                @change="store.setTreatmentOption"
                :editable="devModeEdit"
                name="info"
                class="grid-item warn"
              />

              <h3
                v-if="store.getTreatmentOption.testAfterTreatment"
                class="grid-item item-name"
              >
                Vervolg onderzoek
              </h3>
              <Text
                v-if="store.getTreatmentOption.testAfterTreatment"
                :editable="devModeEdit"
                :text="store.getTreatmentOption.testAfterTreatment"
                @blur="store.setTreatmentOption"
                @change="store.setTreatmentOption"
                name="testAfterTreatment"
                class="grid-item"
              />

              <h3
                v-if="store.getTreatment.explainer"
                class="grid-item item-name"
              >
                Leg uit
              </h3>
              <Text
                :editable="edit"
                :text="store.getTreatment.explainer"
                @blur="store.setTreatment"
                @change="store.setTreatment"
                name="explainer"
                class="grid-item"
              />

              <h3
                v-if="store.getTreatmentOption.documentation"
                class="grid-item item-name"
              >
                Documenteer
              </h3>
              <Text
                :editable="edit"
                :text="store.getTreatmentOption.documentation"
                @blur="store.setTreatmentOption"
                @change="store.setTreatmentOption"
                name="documentation"
                class="grid-item"
              />

              <h3
                v-if="store.getTreatment.sources != null"
                class="grid-item item-name"
              >
                Bronnen
              </h3>
              <div v-if="store.getTreatment.sources != null" class="grid-item">
                <ol>
                  <li
                    v-for="link in store.getTreatment.sources"
                    class="source-link"
                  >
                    <a :href="link.url">{{ link.name }}</a>
                  </li>
                </ol>
              </div>
            </div>

            <template #fallback>
              <Spinner class="spinner"></Spinner>
            </template>
          </ClientOnly>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  .spinner {
    height: 400px;
  }

  button {
    margin-left: 0.5em;
  }

  .grid {
    display: grid;
    grid-template-columns: auto 3fr;
    grid-template-rows: min-content 1fr min-content;
    grid-auto-flow: row;
    gap: 1em;
    justify-content: space-evenly;
    align-content: space-evenly;

    &.edit {
      grid-template-columns: auto 3fr 24px;
    }
  }

  .grid-item {
    // border: thin gray solid;
    // height: 2em;
    overflow: auto;

    &.item-name {
      padding-top: 0.1rem;
      text-transform: uppercase;
    }

    &.danger {
      color: #b43d3d;
    }

    &.warn {
      color: var(--vff-yellow);
    }

    .source-link {
      padding-top: 0.5rem;
      padding-left: 0.5rem;
    }
  }
</style>
