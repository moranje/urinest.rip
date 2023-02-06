<script lang="ts" setup>
  import { ref, reactive } from 'vue';
  const props = withDefaults(
    defineProps<{
      items?: string[];
      name: string;
      editable?: boolean;
    }>(),
    {
      items: () => [],
      editable: false,
    }
  );

  const emit = defineEmits(['change', 'blur']);
  const items = reactive<string[]>([...props.items]);
  const name = ref(props.name);
  const edit = ref(false);

  async function toggle(event: Event) {
    edit.value = !edit.value;

    if (edit.value === false) {
      emit('blur', name.value, items);
    }
  }

  function addItem(event: Event) {
    // @ts-ignore
    const value = event.target.value;
    // @ts-ignore
    event.target.value = '';

    if (value) items.push(value);

    // @ts-ignore
    event.target.blur();

    emit('change', name.value, items);
  }

  function updateItem(event: Event, index: number) {
    // @ts-ignore
    const value = event.target.value;

    items.splice(index, 1, value);
    // @ts-ignore
    event.target.blur();

    emit('change', name.value, items);
  }

  function removeItem(index: number) {
    items.splice(index, 1);

    emit('change', name.value, items);
  }
</script>

<template>
  <div class="root">
    <ul>
      <li v-if="edit">
        <button type="button" @click="toggle" class="button" tabindex="1">
          <ion-icon name="close-outline"></ion-icon>
        </button>
        <input
          @blur="addItem"
          type="text"
          @keyup.enter.prevent="addItem"
          class="input"
          placeholder="Nieuwe contra-indicatie"
          autofocus
          tabindex="0"
        />
      </li>
      <li v-if="edit" v-for="(item, index) in items">
        <button
          type="button"
          @click="removeItem(index)"
          class="button"
          :tabindex="index + 3"
        >
          <ion-icon name="trash-outline"></ion-icon>
        </button>
        <input
          :value="item"
          @keyup.enter.prevent="updateItem($event, index)"
          @blur.prevent="updateItem($event, index)"
          type="text"
          class="input"
          :tabindex="index + 2"
        />
      </li>

      <li v-else v-for="(item, index) in items">
        <input type="checkbox" />
        {{ item.charAt(0).toUpperCase() + item.slice(1) }}
      </li>
    </ul>

    <div v-if="!edit && props.editable">
      <button type="button" @click="toggle" class="button">
        <ion-icon name="pencil-outline"></ion-icon>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
  div.root {
    display: flex;
    flex-direction: row;
    padding-top: 0.5rem;
    padding-left: 0.5rem;

    ul {
      flex-grow: 1;
      flex-shrink: 1;
      flex-basis: auto;
      align-self: auto;
      padding-left: 0;

      li {
        list-style-type: none;
        font-size: 1em;

        input {
          -webkit-appearance: checkbox;
        }
      }
    }
  }

  .button {
    background-color: var(--vff-main-form-bg-color);
    border: var(--vff-border-width) solid var(--vff-secondary-form-bg-color);
    border-radius: var(--vff-border-radius);
    padding: 0 11px;
    float: right;
    line-height: 0;

    color: var(--vff-main-text-color);

    ion-icon {
      font-size: large;
    }
  }

  .button:hover {
    color: var(--vff-main-accent-color);
  }

  .button:active {
    border-color: var(--vff-secondary-form-bg-color);
    background-color: var(--vff-secondary-form-bg-color);
    color: var(--vff-tertiary-text-color);
  }

  input.input {
    // border: var(--vff-border-width) solid var(--vff-secondary-form-bg-color);
    border-radius: var(--vff-border-radius);
    background-color: var(--vff-main-form-bg-color);
    border-bottom: 2px solid;
    margin-bottom: 0.5rem;
    line-height: 37px;
    font-weight: 400;
    font-size: 16px;
    width: calc(100% - 50px);
    display: inherit;
  }

  input.input:focus {
    border-bottom-color: var(--vff-main-accent-color);
  }
</style>
